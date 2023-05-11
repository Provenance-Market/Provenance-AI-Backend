const NFT = artifacts.require('ProvNFT')
const { toWei } = require('web3-utils')

const name = 'Provenance'
const symbol = 'PROV'
const payeeWallets = [
  '0x7bE0e2BA81E9805F834Ee5661693241b3DC3034E',
  '0x111882696d2eCD112FB55C6829C1dad04d44397b',
  '0xE33cb5b4B828C775122FB90F7Dcc7c750b4aee3f',
]

function splitSharesEvenly() {
  const numPayees = payeeWallets.length
  const sharesArray = Array.from({ length: numPayees }, () => 1)
  return sharesArray
}

module.exports = function (deployer) {
  deployer.deploy(
    NFT,
    name,
    symbol,
    payeeWallets,
    splitSharesEvenly(),
    toWei('0.01', 'ether')
  )
}
