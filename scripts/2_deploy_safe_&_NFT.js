const NFT = artifacts.require('ProvNFT')
const GnosisSafe = artifacts.require('GnosisSafe')
const { toWei } = require('web3-utils')

module.exports = async function (deployer, _network, [owner, ..._]) {
  try {
    // Deploy the Gnosis Safe contract
    const gnosisSafe = await GnosisSafe.new({ from: owner })

    // Deploy the ProvNFT contract with the Gnosis Safe contract address
    await deployer.deploy(NFT, gnosisSafe.address, toWei('0.001', 'ether'))

    // Add the owner to the Gnosis Safe contract
    await gnosisSafe.addOwnerWithThreshold(owner, 1)

    // Verify signature
    const contractAddress = NFT.address
    const nonce = await web3.eth.getTransactionCount(owner)
    const data = gnosisSafe.contract.methods
      .addOwnerWithThreshold(owner, 1)
      .encodeABI()
    const chainId = await web3.eth.getChainId()
    const message = {
      from: owner,
      to: contractAddress,
      value: '0',
      gas: 3000000,
      gasPrice: '20000000000', // 20 gwei
      nonce: nonce,
      data: data,
      chainId: chainId,
    }
    const signedMessage = await web3.eth.accounts.sign(
      JSON.stringify(message),
      '0xb3e1d11b9b95f6dc1b2581da3f2e1fcc1cdc756defd6d3991ec18825d75b1173'
    )
    console.log('Signature:', signedMessage.signature)
  } catch (error) {
    console.log(error)
  }
}
