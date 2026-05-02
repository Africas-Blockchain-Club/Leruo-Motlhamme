const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const usdcAddress = process.env.ETH_SEP_USDC_ADDRESS;

    console.log("Using USDC address:", usdcAddress);

    const LmMarketplace = await ethers.getContractFactory("LmMarketplace");
    console.log("Deploying LmMarketplace proxy...");

    const marketplace = await upgrades.deployProxy(LmMarketplace, [usdcAddress], {
        initializer: "initialize",
        kind: "uups",
    });

    await marketplace.waitForDeployment();

    const proxyAddress = await marketplace.getAddress();
    console.log("LmMarketplace proxy deployed to:", proxyAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
