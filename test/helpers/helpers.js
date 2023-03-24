const { toWei, toBN } = require('web3-utils')

const calculateFee = (mintingFee, mintAmount) => {
  const amount = toBN(mintAmount)
  const fee = toBN(mintingFee)
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
  const { logs } = await contract.mint(metadataBaseURI + idCounter, {
    value: mintingFee,
    from: owner,
  })

  expect(logs[0].event).to.equal('TransferSingle')
  expect(logs[0].args.id.toNumber()).to.equal(idCounter)
  expect(logs[1].event).to.equal('URI')
  expect(logs[1].args.id.toNumber()).to.equal(idCounter)
  expect(logs[1].args.value).to.equal(metadataBaseURI + idCounter)
}

async function assertMintBatchEvent({
  contract,
  to,
  fee,
  mintAmount,
  startingId,
}) {
  const metadataURIs = genBatchMetadataURIs(startingId, mintAmount)
  const tx = await contract.mintBatch(mintAmount, metadataURIs, {
    value: calculateFee(fee, mintAmount),
    from: to,
  })
  const ev = tx.logs[mintAmount].args

  expect(ev.to).to.equal(to, 'to address should be set to the sender')
  expect(ev.from).to.equal(
    '0x0000000000000000000000000000000000000000',
    'from address should be set to 0x0'
  )
  expect(ev.ids.length).to.equal(
    mintAmount,
    'number of minted tokens should match mint amount'
  )
  expect(ev.values.length).to.equal(
    mintAmount,
    'number of token quantities should match mint amount'
  )

  const logIds = ev.ids.map(id => id.toNumber())
  const actualIds = Array.from({ length: mintAmount }, (_, i) => startingId + i)
  expect(logIds).to.deep.equal(actualIds, 'minted token ids should be correct')
}

async function assertPayFee(contract, payer) {
  const { logs } = await contract.imageGenerationPayment(toWei('0.5'), {
    value: toWei('0.5'),
    from: payer,
  })

  expect(logs[0].event).to.equal('PayFee')
  expect(logs[0].args.sender).to.equal(payer)
}

module.exports = {
  calculateFee,
  genBatchMetadataURIs,
  assertSingleMintEvent,
  assertMintBatchEvent,
  assertPayFee,
}
