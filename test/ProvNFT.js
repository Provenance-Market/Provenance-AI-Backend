const ProvNFT = artifacts.require('ProvNFT')

contract('ProvNFT', accounts => {
  const metadataBaseURI = 'https://example.com/token_metadata/'
  const [owner, payee1, payee2] = accounts

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
    before(async function () {
      this.contract = await ProvNFT.new([payee1, payee2], [50, 50])
    })

    it('should allow minting of a new NFT', async function () {
      const result = await this.contract.mint(metadataBaseURI + ++idCounter, {
        value: web3.utils.toWei('0.01', 'ether'),
        from: owner,
      })

      expect(result.logs).to.have.lengthOf(2)
      // NFT Transfer log
      expect(result.logs[0].event).to.equal('TransferSingle')
      expect(result.logs[0].args.id.toNumber()).to.equal(0)
      expect(result.logs[0].args.from).to.equal(
        '0x0000000000000000000000000000000000000000'
      )
      expect(result.logs[0].args.to).to.equal(owner)
      expect(result.logs[0].args.value.toNumber()).to.equal(1)
      // NFT URI event
      expect(result.logs[1].event).to.equal('URI')
      expect(result.logs[1].args.id.toNumber()).to.equal(0)
      expect(result.logs[1].args.value).to.equal(metadataBaseURI + idCounter)

      const uri = await this.contract.uri(0)
      expect(uri).to.equal(metadataBaseURI + idCounter)
    })
  })

  describe('Batch Minting', () => {
    let mintAmount = 3
    let metadataURIs = []

    before(async function () {
      this.contract = await ProvNFT.new([payee1, payee2], [50, 50])

      // generate metadataURIs
      for (let id = 0; id < mintAmount; id++) {
        metadataURIs.push(`https://example.com/token_metadata/${id}`)
      }
    })

    it('should allow minting of multiple new NFTs', async function () {
      const result = await this.contract.mintBatch(mintAmount, metadataURIs, {
        value: web3.utils.toWei('0.03', 'ether'),
        from: owner,
      })

      expect(result.logs).to.have.lengthOf(4)
      // NFT URIs logs
      expect(result.logs[0].event).to.equal('URI')
      expect(result.logs[0].args.id.toNumber()).to.equal(0)
      expect(result.logs[0].args.value).to.equal(
        'https://example.com/token_metadata/0'
      )
      expect(result.logs[1].event).to.equal('URI')
      expect(result.logs[1].args.id.toNumber()).to.equal(1)
      expect(result.logs[1].args.value).to.equal(
        'https://example.com/token_metadata/1'
      )
      expect(result.logs[2].event).to.equal('URI')
      expect(result.logs[2].args.id.toNumber()).to.equal(2)
      expect(result.logs[2].args.value).to.equal(
        'https://example.com/token_metadata/2'
      )
      // NFT Transfer Batch Event
      const ids = result.logs[3].args.ids.map(id => id.toNumber())
      expect(ids).to.deep.equal([0, 1, 2])
      expect(result.logs[3].args.from).to.equal(
        '0x0000000000000000000000000000000000000000'
      )
      expect(result.logs[3].args.to).to.equal(owner)

      const uri1 = await this.contract.uri(0)
      expect(uri1).to.equal(metadataURIs[0])
      const uri2 = await this.contract.uri(1)
      expect(uri2).to.equal(metadataURIs[1])
      const uri3 = await this.contract.uri(2)
      expect(uri3).to.equal(metadataURIs[2])
    })

    // it('should not allow minting if ether sent is less than the total mint price', async function () {
  })
})
