const GnosisSafe = artifacts.require('GnosisSafe')

module.exports = function (deployer, network, accounts) {
  // deploy the GnosisSafe contract with a multisig owner
  deployer.deploy(GnosisSafe, accounts[0], 0)
}
