require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [{ version: "0.8.26", settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } } }]
    },
    networks: {
        localhost: {
        url: "http://127.0.0.1:8545",
        },
        sepolia: {
        url: process.env.SEPOLIA_RPC_URL || "",
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        baseSepolia: {
        url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
        accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        chainId: 84532,
        }

    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};
