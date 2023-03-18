require('dotenv').config()
const Web3 = require('web3')
const BN = require('bn.js')
const { toWei, fromWei, toHex } = require('web3-utils')
const contractAbi = require('../../provenance-ai-frontend/src/abis/ProvNFT.json')
const infuraURL = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const web3 = new Web3(infuraURL)
const contractAddress = '0xd2f934b50200b058be56f64c6046cf4f2b6f6e6b'
const contract = new web3.eth.Contract(contractAbi, contractAddress)

// Set up the sender's private key and the recipient's address
const payeeAddress = process.argv[2]
const payeePrivateKey = process.argv[3]

async function withdrawFunds() {
  // Approve the contract to spend the tokens on behalf of the payee
  await contract.methods
    .setApprovalForAll(contractAddress, true)
    .send({ from: payeeAddress })

  const payeeBalance = await contract.methods.releasable(payeeAddress).call()
  const gasPrice = toHex(toWei('10', 'gwei'))
  const gasLimit = toHex(30000)
  const nonce = await web3.eth.getTransactionCount(payeeAddress)

  // Construct the transaction object
  const transactionObject = {
    to: contractAddress,
    gasPrice: gasPrice,
    gas: gasLimit,
    value: toHex(payeeBalance),
    data: await contract.methods.release(payeeAddress).encodeABI(),
  }

  // Sign the transaction with the sender's private key
  const signedTx = await web3.eth.accounts.signTransaction(
    transactionObject,
    payeePrivateKey
  )

  if (signedTx.rawTransaction != null) {
    // Broadcast the signed transaction to the Ethereum network
    await web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on('error', error => console.log(error))

    const released = await contract.methods.released(payeeAddress).call()
    console.log(`₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪ ${released} ETH withdrawn  ₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪`)
  } else {
    console.log('Invalid signedTx', signedTx)
  }
}

async function getInfo() {
  const totalReleased = await contract.methods.totalReleased().call()
  console.log('Amount of Ether already released: ', totalReleased)

  // total amount released to payee
  const released = await contract.methods.released(payeeAddress).call()
  console.log('Amount already released to payee:', released)

  // total releasable amount for payee
  const releasable = await contract.methods.releasable(payeeAddress).call()
  console.log('Amount releasable to payee:', fromWei(releasable, 'ether'))
}

async function main() {
  // General Shares and Funds information
  // await getInfo()

  // Release the funds in the contract to all payees
  withdrawFunds()
}

main()
