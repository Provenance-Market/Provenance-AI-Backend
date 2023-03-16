require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider')
const {
  MNEMONIC,
  INFURA_PROJECT_SECRET,
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  ALCHEMY_SEPOLIA_API_KEY,
} = process.env
const infuraURL = `https://goerli.infura.io/v3/${INFURA_PROJECT_SECRET}`
const infuraMainnetURL = `https://mainnet.infura.io/v3/${INFURA_PROJECT_SECRET}`
const alchemyMumbaiURL = `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
const sepoliaURL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_SEPOLIA_API_KEY}`

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
      provider: () => new HDWalletProvider(MNEMONIC, infuraURL),
      network_id: 5,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    sepolia: {
      provider: () => new HDWalletProvider(MNEMONIC, sepoliaURL),
      network_id: 11155111,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    mumbai: {
      provider: () => new HDWalletProvider(MNEMONIC, alchemyMumbaiURL),
      network_id: 80001,
      timeoutBlocks: 900,
      skipDryRun: true,
    },
    mainnet: {
      provider: () => new HDWalletProvider(MNEMONIC, infuraMainnetURL),
      network_id: 1,
      gas: 8000000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  api_keys: {
    etherscan: `${ETHERSCAN_API_KEY}`,
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
}
