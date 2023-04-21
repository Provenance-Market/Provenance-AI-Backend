const NFT = artifacts.require('ProvNFT')
const GnosisSafe = artifacts.require('GnosisSafe')
const { toWei, padLeft } = require('web3-utils')

module.exports = async function (deployer, network, accounts) {
  const ADDRESS_ZERO = padLeft(0x0, 40)

  // Deploy the Gnosis Safe contract
  await deployer.deploy(GnosisSafe)

  // Create an instance of the Gnosis Safe contract
  const gnosisSafeInstance = await GnosisSafe.new()

  // Set the initial owners and threshold for the multisig wallet
  const owners = [accounts[0], accounts[1], accounts[2]]
  const threshold = 2

  try {
    let receipt = await gnosisSafeInstance.setup(
      owners,
      threshold,
      ADDRESS_ZERO,
      '0x',
      ADDRESS_ZERO,
      ADDRESS_ZERO,
      0,
      ADDRESS_ZERO
    )
    await receipt.wait()
    console.log('Transaction hash:', receipt.transactionHash)
    console.log('Block number:', receipt.blockNumber)
    console.log('Gas used:', receipt.gasUsed)
  } catch (error) {
    console.log('Error:', error)
  }

  // Retrieve the address of the Gnosis Safe contract
  const gnosisSafeAddress = gnosisSafeInstance.address
  console.log('gnosis safe address: ', gnosisSafeAddress)

  // Deploy the NFT contract and pass the Gnosis Safe address and minting fee as constructor arguments
  await deployer.deploy(NFT, gnosisSafeAddress, toWei('0.001', 'ether'))
}
