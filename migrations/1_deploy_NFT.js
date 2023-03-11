const NFT = artifacts.require('ProvNFT')

module.exports = function (deployer) {
  deployer.deploy(
    NFT,
    [
      '0x7e48cd33f9b90c7d07973278754e22b9245ee1b5',
      '0x6da55d9e5836e03c2b20ed9b7673ee07b5dd8ad9',
      '0xf81e5ac85e5f3badfb4ab58a4a7eef5e70d4b056',
    ],
    [33, 33, 33]
  )
}
