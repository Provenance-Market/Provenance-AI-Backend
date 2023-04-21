const NFT = artifacts.require('ProvNFT')
const { toWei } = require('web3-utils')

module.exports = function (deployer) {
  deployer.deploy(
    NFT,
    '0xfDfB91D5a718650faD0f6e12524A4fB95B368Bb4',
    toWei('0.001', 'ether')
  )
}
