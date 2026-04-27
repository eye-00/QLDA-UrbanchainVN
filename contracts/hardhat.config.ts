import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const sepoliaNetwork =
  process.env.RPC_URL && process.env.PRIVATE_KEY
    ? {
        sepolia: {
          url: process.env.RPC_URL,
          accounts: [process.env.PRIVATE_KEY]
        }
      }
    : {};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    ...sepoliaNetwork
  }
};

export default config;
