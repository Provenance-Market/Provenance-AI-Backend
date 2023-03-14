const fs = require('fs').promises
const abi = require('../build/contracts/ProvNFT.json').abi

;(async function () {
  const filePath = '../provenace-ai-frontend/src/abis/ProvNFT.json'

  try {
    await fs.writeFile(filePath, JSON.stringify(abi, null, 2), 'utf8')
    console.log('ABI successfully saved to frontend directory')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`File '${filePath}' not found. Creating new file...`)
      await fs.writeFile(filePath, JSON.stringify(abi, null, 2), 'utf8')
      console.log('New file created with the ABI.')
    } else {
      console.log(`Error: ${err}`)
    }
  }
})()
