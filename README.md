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

### 🏠 [Homepage](#)

### ✨ [Demo](#)

## Install

```sh
yarn
```

## Run Project Locally

1. Run ganache blockchain

```sh
yarn run ganache
```

2. Add network to MetaMask or whichever wallet to connect the [front-end site](https://github.com/Provenance-Market/Provenace-AI-Frontend)

- you'll need the following info to add the network:
  - RPC URL: `http://127.0.0.1:8545`
  - chain ID: `1337`
  - currency symbol: `ETH`

3. Import the ganache accounts into MetaMask to interact with them on the front end

4. Deploy NFT contract

```sh
npx truffle migrate --network ganache
```

5. Run this script to save the NFT ABI to the front end. The front and backend
   repos have to be adjacent to each other or else you'll have to change the
   file path `../Provenance-AI-Frontend/src/abis/ProvNFT.json` in `scripts/saveABI.js`

```sh
node scripts/saveABI.js
```

## Run tests

```sh
npx truffle test
```

## Authors

👤 [**Eddie**](https://github.com/Ed-Marcavage), [**AJ**](https://github.com/aaronjan98)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Provenance-Market/Provenace-AI-Backend/issues).

## Show your support

Give a ⭐️ if this project helped you!
