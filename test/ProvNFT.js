const ProvNFT = artifacts.require('ProvNFT')
const BN = require('bn.js')
const { toBN } = require('web3-utils')
const chai = require('chai')
const expect = chai.use(require('chai-bn')(BN)).expect

const toWei = etherAmount => web3.utils.toWei(etherAmount, 'ether')

const calculateFee = (mintingFee, mintAmount) => {
  const amount = new web3.utils.BN(mintAmount)
  const fee = web3.utils.toBN(mintingFee)
  const totalFee = fee.mul(amount)
  return totalFee
}

const genBatchMetadataURIs = (startId, amount) => {
  let metadataURIs = []
  for (let id = startId; id < startId + amount; id++) {
    metadataURIs.push(`https://example.com/token_metadata/${id}`)
  }
  return metadataURIs
}

async function assertMintBatchEvent({
  contract,
  to,
  fee,
  mintAmount,
  startingId,
}) {
  const metadataURIs = genBatchMetadataURIs(startingId, mintAmount)
  const tx = await contract.mintBatch(mintAmount, metadataURIs, {
    value: calculateFee(fee, mintAmount),
    from: to,
  })
  const ev = tx.logs[mintAmount].args

  expect(ev.to).to.equal(to, 'to address should be set to the sender')
  expect(ev.from).to.equal(
    '0x0000000000000000000000000000000000000000',
    'from address should be set to 0x0'
  )
  expect(ev.ids.length).to.equal(
    mintAmount,
    'number of minted tokens should match mint amount'
  )
  expect(ev.values.length).to.equal(
    mintAmount,
    'number of token quantities should match mint amount'
  )

  const logIds = ev.ids.map(id => id.toNumber())
  const actualIds = Array.from({ length: mintAmount }, (_, i) => startingId + i)
  expect(logIds).to.deep.equal(actualIds, 'minted token ids should be correct')
}

contract('ProvNFT', accounts => {
  const metadataBaseURI = 'https://example.com/token_metadata/'
  const [owner, payee1, payee2] = accounts
  const mintingFee = toWei('0.01')

  describe('Deployment', () => {
    it('should deploy smart contract properly', async () => {
      const provNFT = await ProvNFT.deployed(
        [
          '0x7e48cd33f9b90c7d07973278754e22b9245ee1b5',
          '0x6da55d9e5836e03c2b20ed9b7673ee07b5dd8ad9',
          '0xf81e5ac85e5f3badfb4ab58a4a7eef5e70d4b056',
        ],
        [33, 33, 33]
      )
      assert(provNFT.address !== '')
    })
  })

  describe('Minting', () => {
    let idCounter = -1
    let result

    describe('Success', async () => {
      before(async function () {
        this.contract = await ProvNFT.new([payee1, payee2], [50, 50])

        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: owner,
        })
      })

      it('should allow minting of a new NFT', async function () {
        expect(result.logs[0].event).to.equal('TransferSingle')
        expect(result.logs).to.have.lengthOf(2)
        expect(result.logs[0].args.id.toNumber()).to.equal(0)
        expect(result.logs[0].args.value.toNumber()).to.equal(1)
        expect(result.logs[0].args.to).to.equal(owner)
        expect(result.logs[0].args.from).to.equal(
          '0x0000000000000000000000000000000000000000'
        )
      })

      it('should set the metadata URIs correctly', async () => {
        expect(result.logs[1].event).to.equal('URI')
        expect(result.logs[1].args.id.toNumber()).to.equal(0)
        expect(result.logs[1].args.value).to.equal(metadataBaseURI + idCounter)
      })

      it('should return the corresponding NFT URI', async function () {
        const uri = await this.contract.uri(0)
        expect(uri).to.equal(metadataBaseURI + idCounter)
      })

      it('should increment the token Ids correctly', async function () {
        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: owner,
        })

        expect(result.logs[0].event).to.equal('TransferSingle')
        expect(result.logs[0].args.id.toNumber()).to.equal(1)
        expect(result.logs[1].event).to.equal('URI')
        expect(result.logs[1].args.id.toNumber()).to.equal(1)
        expect(result.logs[1].args.value).to.equal(metadataBaseURI + idCounter)
      })

      it('should mint from another user', async function () {
        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: payee1,
        })

        expect(result.logs[0].event).to.equal('TransferSingle')
        expect(result.logs[0].args.id.toNumber()).to.equal(2)
        expect(result.logs[1].event).to.equal('URI')
        expect(result.logs[1].args.id.toNumber()).to.equal(2)
        expect(result.logs[1].args.value).to.equal(metadataBaseURI + idCounter)
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = new BN(await web3.eth.getBalance(payee1))
        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: payee1,
        })
        const gasUsed = new BN(result.receipt.gasUsed)
        const gasPrice = new BN(await web3.eth.getGasPrice())
        const txCost = gasUsed.mul(gasPrice)
        const amountAfterMint = new BN(await web3.eth.getBalance(payee1))
        const expectedAmount = amountBeforeMint
          .sub(toBN(mintingFee))
          .sub(toBN(txCost))

        expect(amountAfterMint).to.be.a.bignumber.closeTo(
          expectedAmount,
          toBN(1e15)
        )
      })
    })

    describe('Failure', async () => {
      it('should not allow minting if ether sent is less than the total mint price', async function () {
        this.contract = await ProvNFT.new([payee1, payee2], [50, 50])

        try {
          const result = await this.contract.mint(
            metadataBaseURI + ++idCounter,
            {
              value: toWei('0.001'),
              from: owner,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert Invalid ether amount for minting'
          )
        }
      })
    })
  })

  describe('Batch Minting', async function () {
    let result, firstEmptyId, metadataURIs, mintAmount

    describe('Success', async function () {
      before(async function () {
        this.contract = await ProvNFT.new([payee1, payee2], [50, 50])
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
      })

      it('should allow minting of multiple new NFTs', async function () {
        await assertMintBatchEvent({
          contract: this.contract,
          to: owner,
          fee: mintingFee,
          mintAmount: 2,
          startingId: firstEmptyId,
        })
      })

      it('should return the corresponding token IDs and URIs', async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
        mintAmount = 3
        metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)

        const { logs } = await this.contract.mintBatch(
          mintAmount,
          metadataURIs,
          {
            value: calculateFee(mintingFee, mintAmount),
            from: owner,
          }
        )

        expect(logs).to.have.lengthOf(mintAmount + 1)
        for (let id = 0; id < mintAmount; id++) {
          const nftId = logs[id].args.id.toNumber()

          expect(logs[id].event).to.equal('URI')
          expect(nftId).to.equal(firstEmptyId + id)
          expect(logs[id].args.value).to.equal(
            `https://example.com/token_metadata/${nftId}`
          )

          const uri = await this.contract.uri(nftId)
          expect(uri).to.equal(metadataURIs[id])
        }
      })

      it('should increment the token Ids correctly', async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()

        await assertMintBatchEvent({
          contract: this.contract,
          to: owner,
          fee: mintingFee,
          mintAmount: 3,
          startingId: firstEmptyId,
        })
      })

      it('should batch mint from any user & emit event', async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()

        await assertMintBatchEvent({
          contract: this.contract,
          to: payee2,
          fee: mintingFee,
          mintAmount: 2,
          startingId: firstEmptyId,
        })
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = new BN(await web3.eth.getBalance(payee2))
        mintAmount = 2

        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
        let metadataURIs = genBatchMetadataURIs(firstEmptyId, 2)
        result = await this.contract.mintBatch(mintAmount, metadataURIs, {
          value: calculateFee(mintingFee, mintAmount),
          from: payee2,
        })

        const gasUsed = new BN(result.receipt.gasUsed)
        const gasPrice = new BN(await web3.eth.getGasPrice())
        const txCost = gasUsed.mul(gasPrice)
        const amountAfterMint = new BN(await web3.eth.getBalance(payee2))
        const expectedAmount = amountBeforeMint
          .sub(toBN(mintingFee))
          .sub(toBN(txCost))

        expect(amountAfterMint).to.be.a.bignumber.closeTo(
          expectedAmount,
          toBN(1e17)
        )
      })
    })

    describe('Failure', async () => {
      it('should not allow minting if ether sent is less than the total mint price', async function () {
        this.contract = await ProvNFT.new([payee1, payee2], [50, 50])
        mintAmount = 2
        metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)

        try {
          const result = await this.contract.mintBatch(
            mintAmount,
            metadataURIs,
            {
              value: toWei('0.001'),
              from: payee1,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert Invalid ether amount for minting'
          )
        }
      })

      it("should not allow minting if the amount and the length of the URIs list don't match", async () => {
        this.contract = await ProvNFT.new([payee1, payee2], [50, 50])
        mintAmount = 2
        metadataURIs = ['https://example.com/token_metadata/0']

        try {
          const result = await this.contract.mintBatch(
            mintAmount,
            metadataURIs,
            {
              value: mintingFee,
              from: payee2,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert metadataURIs array length does not match the NFT mint amount'
          )
        }
      })
    })
  })
})
