const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip /*run on testnet */
    : describe("FundMe", async function () {
          const sendValue = ethers.parseEther("0.01")
          beforeEach(async () => {
              const fundMeAtAddress = (await deployments.get("FundMe")).address
              const fundMe = await ethers.getContractAt(
                  "FundMe",
                  fundMeAtAddress
              )
          })
          it("allows people to fund and withdraw", async () => {
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              const withdrawTxResponse = await fundMe.withdraw()
              await withdrawTxResponse.wait(1)

              const endingBalance = await ethers.provider.getBalancce(
                  fundMe.target
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
