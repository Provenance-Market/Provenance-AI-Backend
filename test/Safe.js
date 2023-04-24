const Safe = artifacts.require('contracts/GnosisSafe.sol/GnosisSafe.sol')

const fs = require('fs')
const { web3 } = require('@openzeppelin/test-helpers')
const { SafeTransaction } = require('@gnosis.pm/safe-contracts')
const {
  encodeParameters,
} = require('@gnosis.pm/safe-contracts/test/utils/general')

const utils = require('@gnosis.pm/safe-contracts/test/utils/general')
const { ether } = require('@openzeppelin/test-helpers')

const safeAddress = '0xfDfB91D5a718650faD0f6e12524A4fB95B368Bb4'
const wallet1PrivKey =
  'c11489c0f5577d26fd2f66809d75d6b3e0fb5dea935a0fd613dc249ed1d3e13e'
const wallet2PrivKey =
  '2afb43a3b97d6edc21844b3195f92f857be4f6ec22628700494704e4fe5f9536'
const wallet3PrivKey =
  'f46b23a8a8dff254c7cf76b3ae84416762f79a2d0bfd7deb427a84f23ac3b7a3'

const goerliRpc = 'https://goerli.infura.io/v3/39f8fda8300f4f7597902b9020a4ab0b'
const provider = new web3.providers.HttpProvider(goerliRpc)
const web3Instance = new web3(provider)

const getWalletContract = async () => {
  const safeAbi = JSON.parse(
    fs.readFileSync(
      './node_modules/@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json',
      'utf8'
    )
  )
  return new web3Instance.eth.Contract(safeAbi.abi, safeAddress)
}

const sendTransaction = async (to, value, data, from, privateKey) => {
  const gasPrice = await web3Instance.eth.getGasPrice()
  const gasLimit = 500000

  const tx = new SafeTransaction({
    to,
    value,
    data,
    operation: 0,
    gasPrice,
    gasLimit,
    nonce: await web3Instance.eth.getTransactionCount(from),
  })

  tx.sign(Buffer.from(privateKey, 'hex'))

  const txHash = await web3Instance.eth.sendSignedTransaction(
    '0x' + tx.serialize().toString('hex')
  )

  return txHash
}

contract('Safe', async () => {
  let safe

  before(async () => {
    safe = await getWalletContract()
  })

  it('should be able to execute a transaction', async () => {
    const targetAddress = '0x4e70b5dfb5791c50fbd5d75d5c5e5e2e63ce4829'
    const value = ether('0.01').toString()
    const data = '0x'
    const privateKey = wallet1PrivKey

    const transactionHash = await sendTransaction(
      targetAddress,
      value,
      data,
      safeAddress,
      privateKey
    )

    assert.ok(transactionHash)
  })
})
