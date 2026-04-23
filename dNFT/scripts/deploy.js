const { ethers, upgrades} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying dNFT with account:", deployer.address);
    const baseURI = process.env.PINATA_BASE_URI_OF_METADATA + "/";
    console.log("Base URI for metadata: ", baseURI);

    const LMLCNFTFactory = await ethers.getContractFactory("LMLIFECLUB_NFT");
    const lmlcnft = await upgrades.deployProxy(LMLCNFTFactory, 
        [baseURI], { 
            initializer: 'initialize',
            kind: 'uups'});

    await lmlcnft.waitForDeployment();

    console.log("Proxy deployed at address: ", lmlcnft.target);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(lmlcnft.target);
    console.log("Implementation contract address: ", implementationAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
