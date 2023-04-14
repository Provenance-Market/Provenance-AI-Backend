const ProvNFT = artifacts.require('ProvNFT')
const BN = require('bn.js')
const { toWei, toBN } = require('web3-utils')
const chai = require('chai')
const expect = chai.use(require('chai-bn')(BN)).expect
const truffleAssert = require('truffle-assertions')
const {
  calculateFee,
  genBatchMetadataURIs,
  assertSingleMintEvent,
  assertMintBatchEvent,
  assertPayFee,
} = require('./helpers/helpers.js')

const GnosisSafe = artifacts.require('GnosisSafe')

contract('ProvNFT', accounts => {
  const metadataBaseURI = 'https://example.com/token_metadata/'
  const [owner1, owner2, owner3] = accounts
  const mintingFee = toWei('0.001')

  describe('Deployment', () => {
    let gnosisSafe

    before(async () => {
      const {
        abi: gnosisSafeProxyABI,
      } = require('@gnosis.pm/safe-contracts/build/contracts/GnosisSafeProxy.json')
      const {
        abi: gnosisSafeABI,
      } = require('@gnosis.pm/safe-contracts/build/contracts/GnosisSafe.json')

      // Get the deployment bytecode for the GnosisSafeProxy contract
      const gnosisSafeProxyBytecode =
        require('@gnosis.pm/safe-contracts/build/contracts/GnosisSafeProxy.json').deployedBytecode

      // Deploy the GnosisSafeProxy contract
      const GnosisSafeProxy = new web3.eth.Contract(gnosisSafeProxyABI)
      const gnosisSafeProxy = await GnosisSafeProxy.deploy({
        data: gnosisSafeProxyBytecode,
      }).send({ from: owner, gas: '8000000' })
      const gnosisSafeProxyAddress = gnosisSafeProxy.options.address

      // Retrieve the address of the GnosisSafe contract
      const gnosisSafeAddress = await gnosisSafeProxy.methods.getSafe().call()

      // Create an instance of the GnosisSafe contract
      GnosisSafe = new web3.eth.Contract(gnosisSafeABI, gnosisSafeAddress)
    })

    it('should deploy smart contract properly', async () => {
      const provNFT = await ProvNFT.deployed(
        '0xfDfB91D5a718650faD0f6e12524A4fB95B368Bb4',
        mintingFee
      )
      assert(provNFT.address !== '')
    })

    it('should deploy and initialize the contract with the correct owners', async () => {
      const owners = [owner1, owner2, owner3]
      const threshold = 2 // for a 2/3 multisig

      const gnosisSafe = await GnosisSafe.new(owners, threshold)
      const deployedowners = await gnosisSafe.getowners()
      const deployedThreshold = await gnosisSafe.getThreshold()

      assert.deepEqual(
        deployedowners,
        owners,
        'owners not initialized correctly'
      )
      assert.equal(
        deployedThreshold,
        threshold,
        'Threshold not initialized correctly'
      )
    })

    it('should set minting fee', async function () {
      this.contract = await ProvNFT.new(
        '0xfDfB91D5a718650faD0f6e12524A4fB95B368Bb4',
        mintingFee,
        { from: owner1 }
      )
      const actualMintPrice = await this.contract.mintPrice()

      assert.equal(
        actualMintPrice,
        mintingFee,
        'mintPrice is not equal to 0.01 ether'
      )
    })
  })

  describe('Minting', () => {
    let idCounter = -1
    let result

    describe('Success', async () => {
      before(async function () {
        this.contract = await ProvNFT.new(
          '0xfDfB91D5a718650faD0f6e12524A4fB95B368Bb4',
          mintingFee,
          { from: owner1 }
        )

        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: owner1,
        })
      })

      it('should allow minting of a new NFT', async function () {
        // 3 events bc NFTMinted event was added to track mint payments
        expect(result.logs).to.have.lengthOf(3)
        expect(result.logs[0].event).to.equal('TransferSingle')
        expect(result.logs[0].args.id.toNumber()).to.equal(0)
        expect(result.logs[0].args.value.toNumber()).to.equal(1)
        expect(result.logs[0].args.to).to.equal(owner1)
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
        await assertSingleMintEvent(
          this.contract,
          metadataBaseURI,
          ++idCounter,
          owner1,
          mintingFee
        )
      })

      it('should mint from another user', async function () {
        await assertSingleMintEvent(
          this.contract,
          metadataBaseURI,
          ++idCounter,
          owner2,
          mintingFee
        )
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = new BN(await web3.eth.getBalance(owner2))
        result = await this.contract.mint(metadataBaseURI + ++idCounter, {
          value: mintingFee,
          from: owner2,
        })
        const gasUsed = new BN(result.receipt.gasUsed)
        const gasPrice = new BN(await web3.eth.getGasPrice())
        const txCost = gasUsed.mul(gasPrice)
        const amountAfterMint = new BN(await web3.eth.getBalance(owner2))
        const expectedAmount = amountBeforeMint
          .sub(toBN(mintingFee))
          .sub(toBN(txCost))

        expect(amountAfterMint).to.be.a.bignumber.closeTo(
          expectedAmount,
          toBN(1e15)
        )
      })

      it('should return the total supply that has been minted', async function () {
        const totalSupply = await this.contract.getTotalSupply()
        expect(totalSupply.toNumber()).to.equal(4)
      })
    })

    describe('Failure', async function () {
      let nftContract
      let gnosisSafe

      before(async function () {
        gnosisSafe = await GnosisSafe.new(
          [accounts[0], accounts[1], accounts[2]],
          1,
          '0x',
          '0x',
          '0x',
          '0x'
        )
        nftContract = await ProvNFT.new(gnosisSafe.address, mintingFee)
      })

      it('should not allow minting if ether sent is less than the total mint price', async function () {
        try {
          const result = await this.contract.mint(
            metadataBaseURI + ++idCounter,
            {
              value: toWei('0.00001'),
              from: owner1,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert Invalid ether amount for minting'
          )
        }
      })

      it('should not mint when contract is paused', async function () {
        const walletOwners = await gnosisSafe.getOwners()
        const pauseCaller = walletOwners[0] // select the first owner

        try {
          await this.contract.pause({ from: pauseCaller })
        } catch (err) {
          console.error(err)
        }

        await truffleAssert.reverts(
          this.contract.mint(metadataBaseURI + ++idCounter, {
            from: pauseCaller,
            value: toWei('0.001'),
          }),
          'Pausable: paused'
        )
      })
    })
  })

  describe('Batch Minting', async function () {
    let result, firstEmptyId, metadataURIs, mintAmount

    describe('Success', async function () {
      before(async function () {
        this.contract = await ProvNFT.new([owner2, owner3], [1, 1])
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
      })

      it('should allow minting of multiple new NFTs', async function () {
        await assertMintBatchEvent({
          contract: this.contract,
          to: owner1,
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
            from: owner1,
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
          to: owner1,
          fee: mintingFee,
          mintAmount: 3,
          startingId: firstEmptyId,
        })
      })

      it('should batch mint from any user & emit event', async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()

        await assertMintBatchEvent({
          contract: this.contract,
          to: owner3,
          fee: mintingFee,
          mintAmount: 2,
          startingId: firstEmptyId,
        })
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = new BN(await web3.eth.getBalance(owner3))
        mintAmount = 2

        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
        let metadataURIs = genBatchMetadataURIs(firstEmptyId, 2)
        result = await this.contract.mintBatch(mintAmount, metadataURIs, {
          value: calculateFee(mintingFee, mintAmount),
          from: owner3,
        })

        const gasUsed = new BN(result.receipt.gasUsed)
        const gasPrice = new BN(await web3.eth.getGasPrice())
        const txCost = gasUsed.mul(gasPrice)
        const amountAfterMint = new BN(await web3.eth.getBalance(owner3))
        const expectedAmount = amountBeforeMint
          .sub(toBN(mintingFee))
          .sub(toBN(txCost))

        expect(amountAfterMint).to.be.a.bignumber.closeTo(
          expectedAmount,
          toBN(1e17)
        )
      })

      it('should return the total supply that has been minted', async function () {
        const totalSupply = await this.contract.getTotalSupply()
        expect(totalSupply.toNumber()).to.equal(12)
      })

      it("updates the payees' balances with minting fees", async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
        mintAmount = 3

        // Get the total shares held by all the payees
        const totalShares = new BN(await this.contract.totalShares())

        // Get the balances of owner2 & owner3 in the contract before the minting operation
        const balanceBeforeMint1 = new BN(
          await this.contract.releasable(owner2)
        )
        const balanceBeforeMint2 = new BN(
          await this.contract.releasable(owner3)
        )

        // Mint new tokens
        await assertMintBatchEvent({
          contract: this.contract,
          to: owner1,
          fee: mintingFee,
          mintAmount,
          startingId: firstEmptyId,
        })

        // Get the balances of owner2 & owner3 in the contract after the minting operation
        const balanceAfterMint1 = new BN(await this.contract.releasable(owner2))
        const balanceAfterMint2 = new BN(await this.contract.releasable(owner3))

        // Get the balances of owner2 and owner3 on the contract after the minting operation
        const owner2Shares = new BN(await this.contract.shares(owner2))
        const owner3Shares = new BN(await this.contract.shares(owner3))

        // Calculate the expected balances of owner2 and owner3 after the minting operation
        const expectedBalance1 = balanceBeforeMint1.add(
          toBN(mintingFee)
            .mul(toBN(mintAmount))
            .mul(owner2Shares)
            .div(totalShares)
        )
        const expectedBalance2 = balanceBeforeMint2.add(
          toBN(mintingFee)
            .mul(toBN(mintAmount))
            .mul(owner3Shares)
            .div(totalShares)
        )

        expect(balanceAfterMint1).to.be.bignumber.equal(expectedBalance1)
        expect(balanceAfterMint2).to.be.bignumber.equal(expectedBalance2)
      })
    })

    describe('Failure', async () => {
      before(async function () {
        this.contract = await ProvNFT.new([owner2, owner3], [1, 1])
      })

      it('should not allow minting if ether sent is less than the total mint price', async function () {
        mintAmount = 2
        metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)

        try {
          const result = await this.contract.mintBatch(
            mintAmount,
            metadataURIs,
            {
              value: toWei('0.001'),
              from: owner2,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert Invalid ether amount for minting'
          )
        }
      })

      it("should not allow minting if the amount and the length of the URIs list don't match", async function () {
        mintAmount = 2
        metadataURIs = ['https://example.com/token_metadata/0']

        try {
          const result = await this.contract.mintBatch(
            mintAmount,
            metadataURIs,
            {
              value: mintingFee,
              from: owner3,
            }
          )
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert metadataURIs array length does not match the NFT mint amount'
          )
        }
      })

      it('should not mint when contract is paused', async function () {
        firstEmptyId = (await this.contract.getTotalSupply()).toNumber()
        mintAmount = 3
        metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)
        await this.contract.pause({ from: owner3 })

        await truffleAssert.reverts(
          this.contract.mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(mintingFee, mintAmount),
            from: owner3,
          }),
          'Pausable: paused'
        )
      })
    })
  })

  describe('Image Generation', () => {
    describe('Success', async () => {
      it('should pay the AI image generation costs', async function () {
        this.contract = await ProvNFT.new([owner1], [1], { from: owner1 })
        await assertPayFee(this.contract, owner1)
      })
    })

    describe('Failure', async () => {
      before(async function () {
        this.contract = await ProvNFT.new([owner1, owner2, owner3], [1, 1, 1])
      })

      it('should revert for insufficient payment amount', async function () {
        try {
          await this.contract.imageGenerationPayment(toWei('0.5'), {
            value: toWei('0.4'),
            from: owner1,
          })
          expect.fail('Expected transaction to be reverted')
        } catch (error) {
          expect(error.message).to.include(
            'revert Insufficient payment amount for AI image generation'
          )
        }
      })

      it('should revert when contract is paused', async function () {
        await this.contract.pause({ from: owner3 })
        await truffleAssert.reverts(
          this.contract.imageGenerationPayment(toWei('0.5'), {
            value: toWei('0.5'),
            from: owner3,
          }),
          'Pausable: paused'
        )
      })
    })
  })
})
