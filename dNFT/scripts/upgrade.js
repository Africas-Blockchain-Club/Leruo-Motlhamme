const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Upgrading with account:", deployer.address);

    const proxyAddress = process.env.PROXY_ADDRESS;

    const LMLCNFTFactory = await ethers.getContractFactory("LMLIFECLUB_NFTV3");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, LMLCNFTFactory, { kind: "uups" });

    await upgraded.waitForDeployment();

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Proxy address (unchanged):", proxyAddress);
    console.log("New implementation address:", newImplementationAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
