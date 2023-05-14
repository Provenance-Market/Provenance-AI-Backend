;(function saveABI(nft) {
  const fs = require('fs')
  const abi = artifacts.readArtifactSync('ProvNFT').abi
  const filePath = '../provenance-ai-frontend/src/abis/ProvNFT.json'

  if (!fs.existsSync(filePath)) {
    fs.openSync(filePath, 'w')
  }

  fs.writeFile(filePath, JSON.stringify(abi, null, 2), 'utf8', err => {
    if (err) {
      console.log(err)
    } else {
      console.log('ABI saved to frontend directory')
    }
  })
})()
