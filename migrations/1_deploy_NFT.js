let NFT = artifacts.require('ProvNFT')

module.exports = function (deployer) {
  deployer.deploy(
    NFT,
    [
      '0xAB80b7719B06aeD5B3814dbaf54DfdF75B26ab78', 
      '0x41196385fB1ec44F30c2E64D789dBa2ba004Bb24',
      '0xE33cb5b4B828C775122FB90F7Dcc7c750b4aee3f',
    ],
    [33, 33, 33]
  )
}
