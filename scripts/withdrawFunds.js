require('dotenv').config()
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require('../../provenance-ai-frontend/src/abis/ProvNFT.json')
const providerUrl = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const web3 = new Web3(new HDWalletProvider(process.env.MNEMONIC, providerUrl))

const payeeAddress = process.argv[2]

const contractAddress = '0xbffd0fbe3374eB25A25A8ceAf8AE8F231b46b89a'
const contract = new web3.eth.Contract(abi, contractAddress)

async function withdrawFunds() {
  const tx = await contract.methods.release(payeeAddress).send({
    from: payeeAddress,
    gasPrice: web3.utils.toWei('30', 'gwei'),
  })
  const weiAmount = tx.events.PaymentReleased.returnValues.amount
  const ethAmount = web3.utils.fromWei(weiAmount, 'ether')

  console.log('amount released: ', ethAmount, ' eth')
  console.log('Transaction hash:', tx.transactionHash)
  process.exit()
}

withdrawFunds().catch(error => {
  console.error(error)
  process.exit(1)
})
