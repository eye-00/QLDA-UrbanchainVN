import { Contract, JsonRpcProvider, Wallet, ethers } from "ethers";

const ACTIVE_STATUS = 2;

const URBAN_LAND_REGISTRY_ABI = [
  "function registerLand(string registrationCode,string landCode,bytes32 parcelRef,bytes32 ownerRef,string documentCid,bytes32 documentHash,string metadataUri,uint8 status,address tokenOwner) returns (uint256 tokenId)",
  "function updateLandMetadata(uint256 tokenId,string documentCid,bytes32 documentHash,string metadataUri)",
  "event LandRegistered(string indexed registrationCode,uint256 indexed tokenId,string landCode,bytes32 ownerRef,string documentCid,bytes32 documentHash)"
] as const;

type RegisterLandInput = {
  registrationCode: string;
  landCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  ownerType: string;
  ownerFullName: string;
  ownerIdentityNumber?: string | null;
  documentCid: string;
  documentHash: string;
  metadataUri?: string;
};

type RegisterLandOutput = {
  tokenId: number;
  txHash: string;
  mode: "mock" | "rpc";
};

type SyncMetadataOutput = {
  txHash: string;
  mode: "mock" | "rpc";
};

function getMode() {
  return (process.env.BLOCKCHAIN_MODE ?? "mock").toLowerCase();
}

function normalizeBytes32(input: string) {
  const value = input.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) return value;
  return ethers.id(value);
}

function createRefs(input: RegisterLandInput) {
  const parcelRef = normalizeBytes32(
    `${input.provinceCode}|${input.communeName}|${input.mapSheetNumber}|${input.parcelNumber}`
  );
  const ownerRef = normalizeBytes32(
    `${input.ownerType}|${input.ownerFullName}|${input.ownerIdentityNumber ?? ""}`
  );
  return { parcelRef, ownerRef };
}

function createContract() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.BACKEND_WALLET_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl) throw new Error("RPC_URL is required for blockchain mode");
  if (!privateKey) throw new Error("BACKEND_WALLET_PRIVATE_KEY (or PRIVATE_KEY) is required for blockchain mode");
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required for blockchain mode");

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);
  const contract = new Contract(contractAddress, URBAN_LAND_REGISTRY_ABI, signer);
  return { contract, signer };
}

export function isBlockchainEnabled() {
  return getMode() !== "mock";
}

export async function registerLandOnChain(input: RegisterLandInput): Promise<RegisterLandOutput> {
  if (getMode() === "mock") {
    return {
      tokenId: Number((Date.now() % 900000) + 100000),
      txHash: `0xmock${Date.now().toString(16).padStart(60, "0")}`,
      mode: "mock"
    };
  }

  const { contract, signer } = createContract();
  const { parcelRef, ownerRef } = createRefs(input);
  const metadataUri = input.metadataUri ?? `ipfs://${input.documentCid}`;
  const tokenOwner = process.env.BLOCKCHAIN_DEFAULT_TOKEN_OWNER ?? signer.address;

  const tx = await contract.registerLand(
    input.registrationCode,
    input.landCode,
    parcelRef,
    ownerRef,
    input.documentCid,
    normalizeBytes32(input.documentHash),
    metadataUri,
    ACTIVE_STATUS,
    tokenOwner
  );

  const receipt = await tx.wait();
  const txHash = tx.hash;

  let tokenId: number | null = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "LandRegistered") {
        tokenId = Number(parsed.args.tokenId);
        break;
      }
    } catch {
      continue;
    }
  }

  if (!tokenId) {
    throw new Error("Cannot parse tokenId from LandRegistered event");
  }

  return { tokenId, txHash, mode: "rpc" };
}

export async function syncLandMetadataOnChain(
  tokenId: number,
  documentCid: string,
  documentHash: string,
  metadataUri?: string
): Promise<SyncMetadataOutput> {
  if (getMode() === "mock") {
    return {
      txHash: `0xmocksync${Date.now().toString(16).padStart(56, "0")}`,
      mode: "mock"
    };
  }

  const { contract } = createContract();
  const tx = await contract.updateLandMetadata(
    tokenId,
    documentCid,
    normalizeBytes32(documentHash),
    metadataUri ?? `ipfs://${documentCid}`
  );
  await tx.wait();
  return { txHash: tx.hash, mode: "rpc" };
}

export function toChainSafeHash(input: string) {
  return normalizeBytes32(input);
}
