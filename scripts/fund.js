const { ethers } = require("hardhat")

async function main() {
    const fundMeAtAddress = (await deployments.get("FundMe")).address
    const fundMe = await ethers.getContractAt("FundMe", fundMeAtAddress)
    console.log("Funding Contract...")
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    })
    await transactionResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
