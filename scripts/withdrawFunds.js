require('dotenv').config()
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require('../../provenance-ai-frontend/src/abis/ProvNFT.json')
const providerUrl = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const web3 = new Web3(new HDWalletProvider(process.env.MNEMONIC, providerUrl))

const contractAddress = process.argv[2]
// const contractAddress = '0xd2f934b50200b058be56f64c6046cf4f2b6f6e6b'
const payeeAddress = process.argv[3]

const contract = new web3.eth.Contract(abi, contractAddress)

async function withdrawFunds() {
  try {
    const tx = await contract.methods.release(payeeAddress).send({
      from: payeeAddress,
    })
    const weiAmount = tx.events.PaymentReleased.returnValues.amount
    const ethAmount = web3.utils.fromWei(weiAmount, 'ether')

    console.log('Amount released:', ethAmount, 'eth')
    console.log('Transaction hash:', tx.transactionHash)
  } catch (error) {
    console.error(error)
  }
  process.exit()
}

withdrawFunds().catch(error => {
  console.error(error)
  process.exit(1)
})
