const { expect } = require('chai')
const { ethers } = require('hardhat')
const { toWei } = require('./helpers/tokens.js')

const {
  calculateFee,
  genBatchMetadataURIs,
  assertSingleMintEvent,
  assertMintBatchEvent,
  assertPayFee,
} = require('./helpers/helpers.js')

describe('ProvNFT', () => {
  const metadataBaseURI = 'https://example.com/token_metadata/'
  let owner, payee1, payee2
  let provNFT, contract
  const mintingFee = toWei('0.001')

  before(async () => {
    ;[owner, payee1, payee2] = await ethers.getSigners()
    provNFT = await ethers.getContractFactory('ProvNFT')
    contract = await provNFT.deploy(
      [owner.address, payee1.address, payee2.address],
      [1, 1, 1]
    )
  })

  describe('Deployment', () => {
    it('should deploy smart contract properly', async () => {
      expect(contract.address).to.not.be.null
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
          amountBeforeMint.sub(gasCost.add(ethers.BigNumber.from(mintingFee)))
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
      })
    })
  })
})
