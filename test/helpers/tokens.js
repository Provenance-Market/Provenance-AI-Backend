const { ethers } = require('hardhat')

const toWei = n => ethers.utils.parseEther(n.toString())

module.exports = { toWei }
