require('dotenv').config()
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require('../../provenace-ai-frontend/src/abis/ProvNFT.json')
const providerUrl = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const web3 = new Web3(new HDWalletProvider(process.env.MNEMONIC, providerUrl))

const payeeAddress = process.argv[2]

const contractAddress = '0xd2f934b50200b058be56f64c6046cf4f2b6f6e6b'
const contract = new web3.eth.Contract(abi, contractAddress)

async function withdrawFunds() {
  const tx = await contract.methods.release(payeeAddress).send({
    from: payeeAddress,
    gasPrice: web3.utils.toWei('30', 'gwei'),
  })

  console.log('Transaction hash:', tx.transactionHash)
}

withdrawFunds()
