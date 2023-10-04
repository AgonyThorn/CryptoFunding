const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip /*run on testnet */
    : describe("FundMe", async function () {
          const sendValue = ethers.parseEther("0.1")
          let fundMe
          beforeEach(async () => {
              const fundMeAtAddress = (await deployments.get("FundMe")).address
              fundMe = await ethers.getContractAt("FundMe", fundMeAtAddress)
          })
          it("allows people to fund and withdraw", async () => {
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              const withdrawTxResponse = await fundMe.withdraw()
              await withdrawTxResponse.wait(1)

              const endingBalance = await ethers.provider.getBalance(
                  fundMe.target
              )
              console.log("contract balance should be 0, running assert...")
              assert.equal(endingBalance.toString(), "0")
          })
      })
