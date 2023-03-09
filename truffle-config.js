require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const ganacheURL = 'http://127.0.0.1:8545'
const infuraURL = `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const infuraPolygonURL = `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_SECRET}`
const mnemonic = process.env.MNEMONIC

module.exports = {
  networks: {
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 8000000,
      gasPrice: 20000000000,
      skipDryRun: true,
    },
    goerli: {
      provider: () => new HDWalletProvider(mnemonic, infuraURL),
      network_id: 5,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    mumbai: {
      provider: () => new HDWalletProvider(mnemonic, infuraPolygonURL),
      network_id: 80001,
      timeoutBlocks: 900,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: '0.8.19',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: ['truffle-plugin-verify'],
}
