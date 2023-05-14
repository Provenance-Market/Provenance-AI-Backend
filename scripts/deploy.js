const name = 'Provenance'
const symbol = 'PRV'
const payeeWallets = [
  '0xE8426c9AE258261F4Ec0D38932b58D7d166c74C8',
  '0x111882696d2eCD112FB55C6829C1dad04d44397b',
  '0x2c8800a5A08D02fFAb099b2ad1E3B14b3f68236a',
]

function splitSharesEvenly() {
  const numPayees = payeeWallets.length
  const sharesArray = Array.from({ length: numPayees }, () => 1)
  return sharesArray
}

async function main() {
  const NFT = await ethers.getContractFactory('ProvNFT')
  let nft = await NFT.deploy(NAME, SYMBOL, fee)

  await nft.deployed()
  console.log(`\nNFT deployed to: ${ethers.utils.getAddress(nft.address)}\n`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
