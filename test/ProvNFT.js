const { expect } = require('chai')
const { ethers } = require('hardhat')
const { toWei } = require('./helpers/tokens.js')
const { BigNumber } = require('ethers')

const {
  calculateFee,
  genBatchMetadataURIs,
  assertSingleMintEvent,
  assertMintBatchEvent,
  assertPayFee,
} = require('./helpers/helpers.js')

describe('ProvNFT', () => {
  const name = 'Provenance'
  const symbol = 'PRV'
  const metadataBaseURI = 'https://example.com/token_metadata/'
  let owner, payee1, payee2
  let provNFT, contract
  const mintingFee = toWei('0.001')

  before(async () => {
    ;[owner, payee1, payee2] = await ethers.getSigners()
    provNFT = await ethers.getContractFactory('ProvNFT')
    contract = await provNFT.deploy(
      name,
      symbol,
      [owner.address, payee1.address, payee2.address],
      [1, 1, 1],
      mintingFee
    )
  })

  describe('Deployment', () => {
    it('should deploy smart contract properly', async () => {
      expect(contract.address).to.not.be.null
    })

    it('has correct name', async () => {
      expect(await contract.name()).to.equal('Provenance')
    })

    it('has correct symbol', async () => {
      expect(await contract.symbol()).to.equal('PRV')
    })

    it('should have mintPrice equal to 0.001 ether', async function () {
      const actualMintPrice = await contract.mintPrice()

      expect(actualMintPrice).to.equal(
        toWei('0.001'),
        'mintPrice is not equal to 0.001 ether'
      )
    })
  })

  describe('Minting', () => {
    let idCounter = -1
    let result, transaction

    describe('Success', async () => {
      before(async () => {
        transaction = await contract.mint(metadataBaseURI + ++idCounter, {
          value: toWei('0.001'),
          from: owner.address,
        })
        result = await transaction.wait()
      })

      it('should allow minting of a new NFT', async function () {
        // 3 events bc NFTMinted event was added to track mint payments
        expect(result.events).to.have.lengthOf(3)
        expect(result.events[0].event).to.equal('TransferSingle')
        expect(result.events[0].args.id.toNumber()).to.equal(0)
        expect(result.events[0].args.value.toNumber()).to.equal(1)
        expect(result.events[0].args.to).to.equal(owner.address)
        expect(result.events[0].args.from).to.equal(
          ethers.constants.AddressZero
        )
      })

      it('should set the metadata URIs correctly', async () => {
        expect(result.events[1].event).to.equal('URI')
        expect(result.events[1].args.id.toNumber()).to.equal(0)
        expect(result.events[1].args.value).to.equal(
          metadataBaseURI + idCounter
        )
      })

      it('should return the corresponding NFT URI', async function () {
        const uri = await contract.uri(0)
        expect(uri).to.equal(metadataBaseURI + idCounter)
      })

      it('should increment the token Ids correctly', async function () {
        await assertSingleMintEvent(
          contract,
          metadataBaseURI,
          ++idCounter,
          owner.address,
          toWei('0.001')
        )
      })

      it('should mint from another user', async function () {
        await assertSingleMintEvent(
          contract,
          metadataBaseURI,
          ++idCounter,
          payee1.address,
          toWei('0.001')
        )
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = await ethers.provider.getBalance(owner.address)
        const transaction = await contract
          .connect(owner)
          .mint(metadataBaseURI + ++idCounter, {
            value: mintingFee,
          })
        result = await transaction.wait()
        const amountAfterMint = await ethers.provider.getBalance(owner.address)
        const gasCost = transaction.gasPrice.mul(result.gasUsed)
        expect(amountAfterMint).to.equal(
          amountBeforeMint.sub(gasCost.add(BigNumber.from(mintingFee)))
        )
      })

      it('should return the total supply that has been minted', async function () {
        const totalSupply = await contract.getTotalSupply()
        expect(totalSupply.toNumber()).to.equal(4)
      })
    })

    describe('Failure', async function () {
      it('should not allow minting if ether sent is less than the total mint price', async function () {
        await expect(
          contract.mint(metadataBaseURI + ++idCounter, {
            value: ethers.utils.parseEther('0.00001'),
          })
        ).to.be.reverted
      })

      it('should not mint when contract is paused', async function () {
        await contract.connect(payee1).pause()
        await expect(
          contract
            .connect(owner)
            .mint(metadataBaseURI + ++idCounter, { value: mintingFee })
        ).to.be.revertedWith('Pausable: paused')
        // unpause for batch minting
        await contract.connect(payee1).unpause()
      })
    })
  })

  describe('Batch Minting', async function () {
    let firstEmptyId, metadataURIs, mintAmount

    describe('Success', async function () {
      beforeEach(async function () {
        firstEmptyId = (await contract.getTotalSupply()).toNumber()
      })

      it('should allow minting of multiple new NFTs', async function () {
        mintAmount = 2
        await assertMintBatchEvent({
          contract,
          to: owner,
          fee: mintingFee,
          mintAmount,
          startingId: firstEmptyId,
        })
      })

      it('should return the corresponding token IDs and URIs', async function () {
        mintAmount = 3
        const metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)

        const tx = await contract
          .connect(owner)
          .mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(mintingFee, mintAmount),
          })

        const receipt = await tx.wait()
        const events = receipt.events.slice(0, -1) // Ignore SafeTransferBatch event

        expect(events).to.have.lengthOf(mintAmount)
        for (let id = 0; id < mintAmount; id++) {
          const nftId = events[id].args.id.toNumber()

          expect(events[id].event).to.equal('URI')
          expect(nftId).to.equal(firstEmptyId + id)
          expect(events[id].args.value).to.equal(
            `https://example.com/token_metadata/${nftId}`
          )

          const uri = await contract.uri(nftId)
          expect(uri).to.equal(metadataURIs[id])
        }
      })

      it('should increment the token Ids correctly', async function () {
        await assertMintBatchEvent({
          contract,
          to: owner,
          fee: mintingFee,
          mintAmount: 3,
          startingId: firstEmptyId,
        })
      })

      it('should batch mint from any user & emit event', async function () {
        await assertMintBatchEvent({
          contract,
          to: payee2,
          fee: mintingFee,
          mintAmount: 2,
          startingId: firstEmptyId,
        })
      })

      it("should update the minter's ether balance", async function () {
        const amountBeforeMint = await ethers.provider.getBalance(
          payee2.address
        )
        mintAmount = 2

        const metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)
        const tx = await contract
          .connect(payee2)
          .mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(mintingFee, mintAmount),
            from: payee2.address,
          })
        const receipt = await tx.wait()

        const gasUsed = BigNumber.from(receipt.gasUsed)
        const gasPrice = BigNumber.from(await ethers.provider.getGasPrice())
        const txCost = gasUsed.mul(gasPrice)
        const amountAfterMint = await ethers.provider.getBalance(payee2.address)
        const expectedAmount = amountBeforeMint
          .sub(BigNumber.from(mintingFee))
          .sub(txCost)

        expect(amountAfterMint).to.be.closeTo(
          expectedAmount,
          100000000000000000n
        )
      })

      it('should return the total supply that has been minted', async function () {
        const totalSupply = await contract.getTotalSupply()
        expect(totalSupply.toNumber()).to.equal(16)
      })

      it("updates the payees' balances with minting fees", async function () {
        mintAmount = 3

        // Get the total shares held by all the payees
        const totalShares = await contract.totalShares()

        // Get the balances of payee1 & payee2 in the contract before the minting operation
        const balanceBeforeMint1 = await contract['releasable(address)'](
          payee1.address
        )

        const balanceBeforeMint2 = await contract['releasable(address)'](
          payee2.address
        )

        // Mint new tokens
        await assertMintBatchEvent({
          contract,
          to: owner,
          fee: mintingFee,
          mintAmount,
          startingId: firstEmptyId,
        })

        // Get the balances of payee1 & payee2 in the contract after the minting operation
        const balanceAfterMint1 = await contract['releasable(address)'](
          payee1.address
        )
        const balanceAfterMint2 = await contract['releasable(address)'](
          payee2.address
        )

        // Get the balances of payee1 and payee2 on the contract after the minting operation
        const payee1Shares = await contract.shares(payee1.address)
        const payee2Shares = await contract.shares(payee2.address)

        // Calculate the expected balances of payee1 and payee2 after the minting operation
        const expectedBalance1 = balanceBeforeMint1.add(
          mintingFee.mul(mintAmount).mul(payee1Shares).div(totalShares)
        )
        const expectedBalance2 = balanceBeforeMint2.add(
          mintingFee.mul(mintAmount).mul(payee2Shares).div(totalShares)
        )

        expect(balanceAfterMint1).to.be.equal(expectedBalance1)
        expect(balanceAfterMint2).to.be.equal(expectedBalance2)
      })
    })

    describe('Failure', function () {
      beforeEach(async function () {
        firstEmptyId = (await contract.getTotalSupply()).toNumber()
      })

      it('should not allow minting if ether sent is less than the total mint price', async function () {
        const mintAmount = 2
        const metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)

        await expect(
          contract.connect(owner).mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(toWei('0.0001'), mintAmount),
          })
        ).to.be.revertedWith('Invalid ether amount for minting')
      })

      it("should not allow minting if the amount and the length of the URIs list don't match", async function () {
        const mintAmount = 2
        const metadataURIs = ['https://example.com/token_metadata/0']

        await expect(
          contract.connect(owner).mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(toWei('0.01'), mintAmount),
          })
        ).to.be.revertedWith(
          'metadataURIs array length does not match the NFT mint amount'
        )
      })

      it('should not mint when contract is paused', async function () {
        const mintAmount = 3
        const metadataURIs = genBatchMetadataURIs(firstEmptyId, mintAmount)
        await contract.connect(payee2).pause()

        await expect(
          contract.connect(payee2).mintBatch(mintAmount, metadataURIs, {
            value: calculateFee(mintingFee, mintAmount),
          })
        ).to.be.revertedWith('Pausable: paused')
        // unpause for next tests
        await contract.connect(payee2).unpause()
      })
    })
  })

  describe('Image Generation', () => {
    describe('Success', () => {
      it('should pay the AI image generation costs', async function () {
        await assertPayFee(contract, owner)
      })
    })

    describe('Failure', () => {
      it('should revert for insufficient payment amount', async function () {
        await expect(
          contract.connect(owner).imageGenerationPayment(toWei('0.5'), {
            value: toWei('0.4'),
          })
        ).to.be.revertedWith(
          'Insufficient payment amount for AI image generation'
        )
      })

      it('should revert when contract is paused', async function () {
        await contract.connect(payee2).pause()
        await expect(
          contract.connect(payee2).imageGenerationPayment(toWei('0.5'), {
            value: toWei('0.5'),
          })
        ).to.be.revertedWith('Pausable: paused')
      })
    })
  })
})
