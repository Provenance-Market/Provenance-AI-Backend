let NFT = artifacts.require('ProvNFT')

module.exports = function (deployer) {
  deployer.deploy(NFT)
}
