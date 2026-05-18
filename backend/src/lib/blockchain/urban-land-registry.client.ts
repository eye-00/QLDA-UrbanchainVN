import { ethers } from "ethers";

type BlockchainSyncMode = "mock" | "rpc";

const CONTRACT_ABI = [
  "function registerLand(string registrationCode,string landCode,bytes32 parcelRef,bytes32 ownerRef,string documentCid,bytes32 documentHash,string metadataUri,uint8 status,address tokenOwner) returns (uint256)",
  "function tokenIdByRegistrationCode(string registrationCode) view returns (uint256)",
  "function tokenIdByLandCode(string landCode) view returns (uint256)"
] as const;

const ACTIVE_LAND_STATUS = 2;

type RegistrationChainPayload = {
  registrationCode: string;
  landCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  ownerIdentityNumber?: string | null;
  applicantId: string;
  documentCid: string;
  metadataHash: string;
  tokenOwnerAddress?: string;
};

type ChainMintResult = {
  mode: BlockchainSyncMode;
  txHash: string;
  tokenId: number | null;
  contractAddress: string | null;
  tokenOwnerAddress: string | null;
};

type ChainLookupResult = {
  mode: BlockchainSyncMode;
  contractAddress: string | null;
  registrationTokenId: number | null;
  landTokenId: number | null;
};

function resolveMode(): BlockchainSyncMode {
  const raw = (process.env.BLOCKCHAIN_SYNC_MODE ?? "mock").trim().toLowerCase();
  return raw === "rpc" ? "rpc" : "mock";
}

function isHex32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function normalizeBytes32(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return ethers.ZeroHash;
  if (isHex32(trimmed)) return trimmed;
  return ethers.keccak256(ethers.toUtf8Bytes(trimmed));
}

export function buildParcelRef(payload: Pick<RegistrationChainPayload, "provinceCode" | "communeName" | "mapSheetNumber" | "parcelNumber">) {
  const source = `${payload.provinceCode}|${payload.communeName}|${payload.mapSheetNumber}|${payload.parcelNumber}`;
  return ethers.keccak256(ethers.toUtf8Bytes(source));
}

export function buildOwnerRef(payload: Pick<RegistrationChainPayload, "ownerIdentityNumber" | "applicantId">) {
  const source = payload.ownerIdentityNumber?.trim() || payload.applicantId;
  return ethers.keccak256(ethers.toUtf8Bytes(source));
}

function resolveMetadataUri(documentCid: string) {
  if (documentCid.startsWith("ipfs://")) return documentCid;
  return `ipfs://${documentCid}`;
}

function resolveRpcConfig() {
  const rpcUrl = process.env.RPC_URL?.trim();
  const contractAddress = process.env.CONTRACT_ADDRESS?.trim();
  const signerPrivateKey = (process.env.CHAIN_SIGNER_PRIVATE_KEY ?? process.env.PRIVATE_KEY)?.trim();
  if (!rpcUrl) throw new Error("RPC_URL is required when BLOCKCHAIN_SYNC_MODE=rpc");
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required when BLOCKCHAIN_SYNC_MODE=rpc");
  if (!signerPrivateKey) {
    throw new Error("CHAIN_SIGNER_PRIVATE_KEY (or PRIVATE_KEY) is required when BLOCKCHAIN_SYNC_MODE=rpc");
  }
  if (!ethers.isAddress(contractAddress)) throw new Error("CONTRACT_ADDRESS is invalid");
  return { rpcUrl, contractAddress, signerPrivateKey };
}

function resolveRpcReadConfig() {
  const rpcUrl = process.env.RPC_URL?.trim();
  const contractAddress = process.env.CONTRACT_ADDRESS?.trim();
  if (!rpcUrl) throw new Error("RPC_URL is required when BLOCKCHAIN_SYNC_MODE=rpc");
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required when BLOCKCHAIN_SYNC_MODE=rpc");
  if (!ethers.isAddress(contractAddress)) throw new Error("CONTRACT_ADDRESS is invalid");
  return { rpcUrl, contractAddress };
}

export async function mintRegistrationRecord(payload: RegistrationChainPayload): Promise<ChainMintResult> {
  const mode = resolveMode();
  if (mode === "mock") {
    return {
      mode,
      txHash: `0x${Date.now().toString(16)}chain`,
      tokenId: null,
      contractAddress: null,
      tokenOwnerAddress: payload.tokenOwnerAddress ?? null
    };
  }

  const { rpcUrl, contractAddress, signerPrivateKey } = resolveRpcConfig();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(signerPrivateKey, provider);
  const tokenOwnerAddress = payload.tokenOwnerAddress?.trim();
  if (!tokenOwnerAddress || !ethers.isAddress(tokenOwnerAddress)) {
    throw new Error("A verified default wallet address is required for on-chain mint");
  }

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  const documentHash = normalizeBytes32(payload.metadataHash);
  const tx = await contract.registerLand(
    payload.registrationCode,
    payload.landCode,
    buildParcelRef(payload),
    buildOwnerRef(payload),
    payload.documentCid,
    documentHash,
    resolveMetadataUri(payload.documentCid),
    ACTIVE_LAND_STATUS,
    ethers.getAddress(tokenOwnerAddress)
  );
  await tx.wait();

  const tokenIdValue: bigint = await contract.tokenIdByRegistrationCode(payload.registrationCode);
  return {
    mode,
    txHash: tx.hash,
    tokenId: Number(tokenIdValue),
    contractAddress,
    tokenOwnerAddress: ethers.getAddress(tokenOwnerAddress)
  };
}

export async function lookupRegistrationOnChain(
  registrationCode: string,
  landCode: string
): Promise<ChainLookupResult> {
  const mode = resolveMode();
  if (mode === "mock") {
    return {
      mode,
      contractAddress: null,
      registrationTokenId: null,
      landTokenId: null
    };
  }

  const { rpcUrl, contractAddress } = resolveRpcReadConfig();
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

  const [registrationTokenId, landTokenId] = await Promise.all([
    contract.tokenIdByRegistrationCode(registrationCode) as Promise<bigint>,
    contract.tokenIdByLandCode(landCode) as Promise<bigint>
  ]);

  return {
    mode,
    contractAddress,
    registrationTokenId: registrationTokenId > 0n ? Number(registrationTokenId) : null,
    landTokenId: landTokenId > 0n ? Number(landTokenId) : null
  };
}
