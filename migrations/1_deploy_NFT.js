const axios = require('axios')
const NFT = artifacts.require('ProvNFT')
const { toWei } = require('web3-utils')

const name = 'Provenance'
const symbol = 'PRV'
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

module.exports = async function (deployer, network) {
  let gasPrice

  // Fetch gas price for current network
  if (network === 'mumbai') {
    const response = await axios.get('https://gasstation-mumbai.matic.today')
    gasPrice = response.data.standard
  } else if (network === 'polygon') {
    const response = await axios.get('https://gasstation-mainnet.matic.network')
    gasPrice = response.data.standard
  } else if (network === 'test' || network === 'ganache') {
    gasPrice = '1000000000'
  } else {
    throw new Error(`Unsupported network: ${network}`)
  }

  console.log('Gas Price: ', gasPrice)

  try {
    await deployer.deploy(
      NFT,
      name,
      symbol,
      payeeWallets,
      splitSharesEvenly(),
      toWei('0.01', 'ether'),
      { gasPrice, skipDryRun: true }
    )
  } catch (error) {
    console.error('Error deploying contract:', error)
  }
}
