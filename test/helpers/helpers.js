const { expect } = require('chai')
const { ethers } = require('hardhat')
const { BigNumber } = require('ethers')

const calculateFee = (mintingFee, mintAmount) => {
  const amount = BigNumber.from(mintAmount)
  const fee = BigNumber.from(mintingFee)
  const totalFee = fee.mul(amount)
  return totalFee
}

const genBatchMetadataURIs = (startId, amount) => {
  let metadataURIs = []
  for (let id = startId; id < startId + amount; id++) {
    metadataURIs.push(`https://example.com/token_metadata/${id}`)
  }
  return metadataURIs
}

async function assertSingleMintEvent(
  contract,
  metadataBaseURI,
  idCounter,
  owner,
  mintingFee
) {
  const tx = await contract.mint(metadataBaseURI + idCounter, {
    value: mintingFee,
  })
  const receipt = await tx.wait()

  expect(receipt.events[0].event).to.equal('TransferSingle')
  expect(receipt.events[0].args.id.toNumber()).to.equal(idCounter)
  expect(receipt.events[1].event).to.equal('URI')
  expect(receipt.events[1].args.id.toNumber()).to.equal(idCounter)
  expect(receipt.events[1].args.value).to.equal(metadataBaseURI + idCounter)
}

async function assertMintBatchEvent({
  contract,
  to,
  fee,
  mintAmount,
  startingId,
}) {
  const metadataURIs = genBatchMetadataURIs(startingId, mintAmount)
  const tx = await contract.connect(to).mintBatch(mintAmount, metadataURIs, {
    value: calculateFee(fee, mintAmount),
  })
  const receipt = await tx.wait()
  const ev = receipt.events[mintAmount].args

  expect(ev.to).to.equal(to.address, 'to address should be set to the sender')
  expect(ev.from).to.equal(
    '0x0000000000000000000000000000000000000000',
    'from address should be set to 0x0'
  )
  expect(ev.ids.length).to.equal(
    mintAmount,
    'number of minted tokens should match mint amount'
  )

  const logIds = ev.ids.map(id => id.toNumber())
  const actualIds = Array.from({ length: mintAmount }, (_, i) => startingId + i)
  expect(logIds).to.deep.equal(actualIds, 'minted token ids should be correct')
}

async function assertPayFee(contract, payer) {
  const tx = await contract.imageGenerationPayment(
    ethers.utils.parseEther('0.5'),
    {
      value: ethers.utils.parseEther('0.5'),
    }
  )
  const receipt = await tx.wait()

  expect(receipt.events[0].event).to.equal('PayFee')
  expect(receipt.events[0].args.sender).to.equal(payer)
}

module.exports = {
  calculateFee,
  genBatchMetadataURIs,
  assertSingleMintEvent,
  assertMintBatchEvent,
  assertPayFee,
}
