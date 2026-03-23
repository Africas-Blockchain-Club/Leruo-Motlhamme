const {ethers} = require("hardhat");

async function main(){
    const [deployer] = await ethers.getSigners();

    console.log("Deploying Vending machine with account: ", deployer.address);

    // Get factories
    const VendingMachineFactory = await ethers.getContractFactory("VendingMachine");
    const VendingDeployed = await VendingMachineFactory.deploy(VendingMachineFactory);

    await VendingDeployed.waitForDeployment();

    console.log(`Vending machine deployed at: ${VendingDeployed.target}`);
    console.log("DEPLOYMENT COMPLETE!");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
