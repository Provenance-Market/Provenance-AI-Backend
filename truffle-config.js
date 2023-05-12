require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const {
  MNEMONIC,
  ALCHEMY_API_KEY_MUMBAI,
  ALCHEMY_API_KEY_POLY,
  POLYGONSCAN_API_KEY,
} = process.env
const alchemyMumbaiURL = `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY_MUMBAI}`
const alchemyPolyURL = `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_POLY}`

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
    mumbai: {
      provider: () => new HDWalletProvider(MNEMONIC, alchemyMumbaiURL),
      network_id: 80001,
      timeoutBlocks: 900,
      skipDryRun: true,
    },
    polygon: {
      provider: () => new HDWalletProvider(MNEMONIC, alchemyPolyURL),
      network_id: 137,
      gas: 29000000, //8000000,
      gasPrice: 350002998128,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  api_keys: {
    polygonscan: `${POLYGONSCAN_API_KEY}`,
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
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/',
  migrations_directory: './migrations/',
}
