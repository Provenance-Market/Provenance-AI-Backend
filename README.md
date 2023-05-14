<h1 align="center">Provenance Back End</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/Provenance-Market/Provenace-AI-Backend" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> NFT marketplace for AI-generated personalized artwork

## Links

🏠 [Live Site Homepage](https://app.prov.ai) \
✨ [Contract Deployed on Polygon](https://polygonscan.com/address/0x7d2226Dc01B91471A37BD790e3E37b2d20E76E41)

## Install

```sh
yarn
```

## Code Style

- Format contracts

```sh
yarn prettier
```

- Run linter

```sh
yarn linter
```

## Run tests

```sh
npx hardhat test
```

## Deploy to Public Networks

1. Configure keys in your `.env`

```.env
PRIVATE_KEYS="secret/private keys seperated by commas"
ALCHEMY_API_KEY_MUMBAI="polygon testnet api key"
ALCHEMY_API_KEY_POLY="polygon mainnet api key"
POLYGONSCAN_API_KEY="polygonscan key to verify contract"
```

2. Just in case you need to flatten your contract

- N.B. Skip this because hardhat links dependent contracts during deployment; but, here's the command if you need to flatten for a certain network

```sh
npx hardhat flatten ./contracts/ProvNFT.sol > out/ProvNFT_flat.sol
```

3. Deploy to testnet or mainnet

- N.B. Add and configure networks in `hardhat.config.js` and make sure to run the deploy command in the root of the project
- Command for deploying with all your migration scripts

```sh
npx hardhat run scripts/deploy.js --network mumbai
```

- Then you'll need to copy the outputted NFT address from the command and update the config file on the front end.

4. Verify Contract

```sh
npx hardhat verify {ContractAddress} {contract-constructor-params} --network mumbai
```

## Run Project Locally

1. Run development blockchain

```sh
yarn run dev
```

2. Add network to MetaMask or whichever wallet to connect the [front-end site](https://github.com/Provenance-Market/Provenace-AI-Frontend)

- you'll need the following info to add the network:
  - RPC URL: `http://127.0.0.1:8545`
  - chain ID: `1337`
  - currency symbol: `ETH`

3. Import the ganache accounts into MetaMask to interact with them on the front end

4. Deploy NFT contract

```sh
npx hardhat run scripts/deploy.js --network dev
```

5. Run this script to save the NFT ABI to the front end. The front and backend
   repos have to be adjacent to each other or else you'll have to change the
   file path `../provenance-ai-frontend/src/abis/ProvNFT.json` in `scripts/saveABI.js`

```sh
node scripts/saveABI.js
```

## Withdraw Payee Share of Funds

```sh
node scripts/withdrawFunds.js {contract_address} {payee_wallet_address}
```

## Reset the Minting Fee

```sh
node scripts/setMintFee.js {contract_address} {wallet_address} {new_mint_fee_in_wei}
```

## Authors

👤 [**Eddie**](https://github.com/Ed-Marcavage), [**AJ**](https://github.com/aaronjan98), [**Jake**](https://github.com/masonjake), [**Rohith**](https://github.com/Rohith09)

## 🤝 Contributing

Contributions, issues and feature requests are welcome! \
Feel free to check [issues page](https://github.com/Provenance-Market/Provenace-AI-Backend/issues).

## Show your support

Give a ⭐️ if this project helped you!
