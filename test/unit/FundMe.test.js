const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip /*run on dev chain */
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("0.1")
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              console.log(`Deployer is: ${deployer}`)

              const fundMeAtAddress = (await deployments.get("FundMe")).address
              fundMe = await ethers.getContractAt("FundMe", fundMeAtAddress)

              const mockV3AggregatorAddress = (
                  await deployments.get("MockV3Aggregator")
              ).address
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  mockV3AggregatorAddress
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })

              it("Updates the amount funded data structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  console.log(`Amount funded: ${response}`)
                  console.log("Updating the fund")
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraws ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  console.log(`Gas used: ${gasUsed}`)
                  console.log(`Gas price: ${gasPrice}`)
                  const gasCost = gasUsed * gasPrice
                  console.log(`Gas cost: ${gasCost}`)

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1 /*index 0 is deployer */; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attackerConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })
