import "dotenv/config";
import { describe, expect, it } from "vitest";
import { ethers } from "ethers";
import { lookupRegistrationOnChain } from "../src/lib/blockchain/urban-land-registry.client.js";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

describe("Sprint 4 RPC smoke (fail hard)", () => {
  const rpcModeEnabled = (process.env.BLOCKCHAIN_SYNC_MODE ?? "").trim().toLowerCase() === "rpc";
  const runRpc = rpcModeEnabled ? it : it.skip;

  runRpc("connects to real RPC and checks registry contract", async () => {
    process.env.BLOCKCHAIN_SYNC_MODE = "rpc";

    const rpcUrl = requiredEnv("RPC_URL");
    const contractAddress = requiredEnv("CONTRACT_ADDRESS");
    const expectedChainId = Number(process.env.BLOCKCHAIN_CHAIN_ID?.trim() || "11155111");
    if (!Number.isFinite(expectedChainId) || expectedChainId <= 0) {
      throw new Error("BLOCKCHAIN_CHAIN_ID must be a positive integer");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    expect(Number(network.chainId)).toBe(expectedChainId);

    const code = await provider.getCode(contractAddress);
    expect(code).not.toBe("0x");

    const lookup = await lookupRegistrationOnChain(`RPC-SMOKE-${Date.now()}`, `LAND-SMOKE-${Date.now()}`);
    expect(lookup.mode).toBe("rpc");
    expect(lookup.contractAddress?.toLowerCase()).toBe(contractAddress.toLowerCase());
  }, 60_000);
});
