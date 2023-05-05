require('dotenv').config()
const Web3 = require('web3')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require('../../provenance-ai-frontend/src/abis/ProvNFT.json')
const providerUrl = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const web3 = new Web3(new HDWalletProvider(process.env.MNEMONIC, providerUrl))

// const { toWei } = require('web3-utils')

const contractAddress = process.argv[2]
// const contractAddress = '0xd2f934b50200b058be56f64c6046cf4f2b6f6e6b'
const walletAddress = process.argv[3]
const newMintFee = process.argv[4] // fee in wei
// const newMintFee = toWei('0.5', 'ether')

const contract = new web3.eth.Contract(abi, contractAddress)

async function setMintFee() {
  try {
    const tx = await contract.methods.setMintFee(newMintFee).send({
      from: walletAddress,
    })
    console.log(tx.events)
    console.log('\nMint fee successfully reset.')
  } catch (error) {
    console.error(error)
  }
  process.exit()
}

setMintFee().catch(error => {
  console.error(error)
  process.exit(1)
})
