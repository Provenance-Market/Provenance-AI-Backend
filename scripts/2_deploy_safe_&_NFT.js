const NFT = artifacts.require('ProvNFT')
const GnosisSafe = artifacts.require('GnosisSafe')
const { toWei } = require('web3-utils')

module.exports = async function (deployer, network, accounts) {
  // Deploy the Gnosis Safe contract
  await deployer.deploy(GnosisSafe)

  // Retrieve the address of the Gnosis Safe contract
  const gnosisSafeAddress = GnosisSafe.address

  // Create an instance of the Gnosis Safe contract
  const gnosisSafe = await GnosisSafe.at(gnosisSafeAddress)

  // Set the initial owners and threshold for the multisig wallet
  const owners = [accounts[0], accounts[1], accounts[2]] // Add your desired owners here
  const threshold = 2 // Set your desired threshold here
  await gnosisSafe.setup(owners, threshold)

  // Deploy the NFT contract and pass the Gnosis Safe address and minting fee as constructor arguments
  await deployer.deploy(NFT, gnosisSafeAddress, toWei('0.001', 'ether'))
}
