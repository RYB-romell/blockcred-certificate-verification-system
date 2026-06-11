// hardhat.config.cjs
require('@nomiclabs/hardhat-ethers');  // Hardhat plugin for Ethers.js
require('dotenv').config();             // Load .env variables

module.exports = {
  solidity: {
    version: "0.8.28",                  // Match your contracts
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY],  // Your wallet private key from .env
    },
  },
};