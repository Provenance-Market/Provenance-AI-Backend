const NFT = artifacts.require('ProvNFT')

const totalShares = 100
const payeeWallets = [
  '0xAB80b7719B06aeD5B3814dbaf54DfdF75B26ab78',
  '0x41196385fB1ec44F30c2E64D789dBa2ba004Bb24',
  '0xE33cb5b4B828C775122FB90F7Dcc7c750b4aee3f',
]

// split payments evenly among payees
function splitShares() {
  const numPayees = payeeWallets.length
  let sharesArray = Array.from({ length: numPayees }, () => 0)
  let remainingShares = totalShares

  for (let s = 0; s < numPayees; s++) {
    if (s === numPayees - 1) {
      sharesArray[s] = remainingShares
    } else {
      const share = Math.floor(remainingShares / (numPayees - s))
      sharesArray[s] = share
      remainingShares -= share
    }
  }

  return sharesArray
}

module.exports = function (deployer) {
  deployer.deploy(NFT, payeeWallets, splitShares())
}
