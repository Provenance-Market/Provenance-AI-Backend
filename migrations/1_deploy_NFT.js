const NFT = artifacts.require('ProvNFT')

module.exports = function (deployer) {
  deployer.deploy(
    NFT,
    [
      '0x6E9B25457D88fB51868540EaDc9df2B2261e0960',
      '0x41196385fB1ec44F30c2E64D789dBa2ba004Bb24',
      '0xAB80b7719B06aeD5B3814dbaf54DfdF75B26ab78',
    ],
    [33, 33, 33]
  )
}
