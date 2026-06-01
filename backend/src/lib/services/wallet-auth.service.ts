import { ethers } from "ethers";
import { BlockchainNetwork } from "@prisma/client";
import { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";
import { forbiddenError } from "../errors.js";
import { prisma } from "../prisma.js";

const CITIZEN_ROLES = ["CITIZEN", "BUSINESS"];

export function isCitizenRole(role: string): boolean {
  return CITIZEN_ROLES.includes(role);
}

export function resolveExpectedBlockchainNetwork(): BlockchainNetwork {
  const raw = (process.env.BLOCKCHAIN_NETWORK ?? "SEPOLIA").trim().toUpperCase();
  return (Object.values(BlockchainNetwork) as string[]).includes(raw)
    ? (raw as BlockchainNetwork)
    : BlockchainNetwork.SEPOLIA;
}

export function resolveExpectedBlockchainChainId(): number {
  const parsed = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  if (!Number.isFinite(parsed) || parsed <= 0) return 11155111;
  return parsed;
}

export function resolveExplorerBaseUrl(network: BlockchainNetwork): string {
  const byEnv = process.env.BLOCKCHAIN_EXPLORER_BASE_URL?.trim();
  if (byEnv) return byEnv;
  if (network === "SEPOLIA") return "https://sepolia.etherscan.io/tx/";
  return "";
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address.trim());
}

export function resolveBlockchainSyncMode(
  actorRole: string,
  requestedMode?: "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN"
): "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN" {
  const roleDefault = isCitizenRole(actorRole) ? "CITIZEN_DIRECT_SIGN" : "OFFICER_SERVICE_WALLET";
  const mode = requestedMode ?? roleDefault;
  if (mode === "CITIZEN_DIRECT_SIGN" && !isCitizenRole(actorRole))
    throw forbiddenError("OWNERSHIP_DENIED");
  if (mode === "OFFICER_SERVICE_WALLET" && isCitizenRole(actorRole))
    throw forbiddenError("walletAuthMissing");
  return mode;
}

export async function ensureServiceWalletAuthorizationForSync(
  actor: AuthenticatedRequest["user"],
  input: { walletAuthorizationId: string; signerWalletAddress: string; signerChainId: number }
) {
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();
  const now = new Date();

  const authorization = await prisma.serviceWalletAuthorization.findUnique({
    where: { id: input.walletAuthorizationId },
    include: { wallet: { select: { id: true, address: true, network: true, status: true } } }
  });

  if (!authorization) throw forbiddenError("walletAuthMissing: Không tìm thấy quyền ví công vụ");
  if (authorization.status !== "ACTIVE")
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ không còn hiệu lực");
  if (authorization.effectiveTo && authorization.effectiveTo <= now)
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ đã hết hạn");
  if (authorization.network !== expectedNetwork || authorization.chainId !== expectedChainId)
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ không khớp network/chainId");
  if (input.signerChainId !== expectedChainId)
    throw forbiddenError("walletAuthMissing: signerChainId không hợp lệ");
  if (
    normalizeAddress(input.signerWalletAddress) !== normalizeAddress(authorization.wallet.address)
  )
    throw forbiddenError("walletAuthMissing: Ví ký không trùng với ví công vụ được cấp quyền");
  if (
    authorization.wallet.network !== expectedNetwork ||
    authorization.wallet.status !== "VERIFIED"
  )
    throw forbiddenError("walletAuthMissing: Ví công vụ chưa xác minh");
  if (authorization.userId !== actor.userId)
    throw forbiddenError("walletAuthMissing: Bạn không sở hữu quyền ví này");
  if (authorization.roleScope !== actor.role)
    throw forbiddenError("walletAuthMissing: Vai trò không khớp");

  return { authorization, expectedNetwork, expectedChainId };
}

export async function ensureCitizenWalletAuthorizationForSync(
  actor: AuthenticatedRequest["user"],
  registrationApplicantId: string,
  input: { signerWalletAddress: string; signerChainId: number }
) {
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();

  if (actor.userId !== registrationApplicantId) throw forbiddenError("OWNERSHIP_DENIED");
  if (input.signerChainId !== expectedChainId) throw forbiddenError("WRONG_NETWORK");

  const normalizedSignerAddress = normalizeAddress(input.signerWalletAddress);
  const defaultWallet = await prisma.walletAccount.findFirst({
    where: { userId: actor.userId, status: "VERIFIED", isDefault: true, network: expectedNetwork },
    select: { id: true, address: true, network: true }
  });

  if (!defaultWallet) throw forbiddenError("WALLET_MISMATCH: Chưa có ví mặc định");
  if (defaultWallet.network !== expectedNetwork)
    throw forbiddenError("WRONG_NETWORK: Ví mặc định không đúng network");
  if (normalizeAddress(defaultWallet.address) !== normalizedSignerAddress)
    throw forbiddenError("WALLET_MISMATCH: Ví ký không trùng với ví mặc định");

  return { expectedNetwork, expectedChainId, normalizedSignerAddress, defaultWallet };
}
