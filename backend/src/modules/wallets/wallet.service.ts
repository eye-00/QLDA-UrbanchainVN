import { randomBytes, createHash } from "node:crypto";
import { Prisma, WalletAccount, WalletStatus } from "@prisma/client";
import { ethers } from "ethers";
import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { AuthUser } from "../auth/auth.middleware.js";

const WALLET_NONCE_TTL_MINUTES = Number(process.env.WALLET_NONCE_TTL_MINUTES || 10);

function normalizeWalletAddress(address: string) {
  const candidate = address.trim();
  if (!ethers.isAddress(candidate)) throw badRequestError("Wallet address is invalid");
  return ethers.getAddress(candidate);
}

function hashAddress(address: string) {
  return createHash("sha256").update(address).digest("hex");
}

function getWalletAddressPreview(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function buildVerificationMessage(address: string, nonce: string, issuedAt: string) {
  return [
    "UrbanChain-VN Wallet Verification",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `IssuedAt: ${issuedAt}`,
    "Purpose: Verify wallet ownership for account linking only."
  ].join("\n");
}

function getRouteIdParam(value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (Array.isArray(value) && value[0] && value[0].trim().length > 0) return value[0];
  throw badRequestError("Wallet id is invalid");
}

async function getOwnedWalletOrThrow(walletId: string, userId: string) {
  const wallet = await prisma.walletAccount.findUnique({
    where: { id: walletId }
  });
  if (!wallet) throw notFoundError("Wallet not found");
  if (wallet.userId !== userId) throw forbiddenError("Cannot access another user's wallet");
  return wallet;
}

export async function listWallets(user: AuthUser) {
  const wallets = await prisma.walletAccount.findMany({
    where: { userId: user.userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });

  return {
    items: wallets,
    total: wallets.length
  };
}

export async function connectWallet(user: AuthUser, body: { address: string; network: string }) {
  const normalizedAddress = normalizeWalletAddress(body.address);

  const existing = await prisma.walletAccount.findFirst({
    where: {
      network: body.network as any,
      address: normalizedAddress
    }
  });

  if (existing && existing.userId !== user.userId) {
    await writeAuditLog({
      actorId: user.userId,
      action: "WALLET_CONNECT_CONFLICT",
      entityType: "WALLET",
      entityId: `${body.network}:${normalizedAddress}`,
      payload: {
        network: body.network,
        addressHash: hashAddress(normalizedAddress)
      }
    });
    throw conflictError("Wallet is already linked to another account");
  }

  if (existing && existing.userId === user.userId) {
    await writeAuditLog({
      actorId: user.userId,
      action: "WALLET_CONNECTED",
      entityType: "WALLET",
      entityId: existing.id,
      payload: {
        network: existing.network,
        addressPreview: getWalletAddressPreview(existing.address),
        addressHash: hashAddress(existing.address),
        status: existing.status,
        result: "ALREADY_LINKED"
      }
    });
    return { wallet: existing, alreadyLinked: true as const };
  }

  const wallet = await prisma.walletAccount.create({
    data: {
      userId: user.userId,
      address: normalizedAddress,
      network: body.network as any,
      status: WalletStatus.PENDING_VERIFICATION,
      isDefault: false
    }
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "WALLET_CONNECTED",
    entityType: "WALLET",
    entityId: wallet.id,
    payload: {
      network: wallet.network,
      addressPreview: getWalletAddressPreview(wallet.address),
      addressHash: hashAddress(wallet.address),
      status: wallet.status
    }
  });

  return { wallet, alreadyLinked: false as const };
}

export async function createChallenge(user: AuthUser, walletIdParam: string) {
  const walletId = getRouteIdParam(walletIdParam);
  const wallet = await getOwnedWalletOrThrow(walletId, user.userId);

  if (wallet.status === WalletStatus.INACTIVE) {
    throw badRequestError("Inactive wallet cannot create verification challenge");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + WALLET_NONCE_TTL_MINUTES * 60 * 1000);
  const nonce = randomBytes(16).toString("hex");
  const message = buildVerificationMessage(wallet.address, nonce, now.toISOString());

  await prisma.walletVerificationChallenge.updateMany({
    where: {
      walletId: wallet.id,
      usedAt: null,
      expiresAt: { gt: now }
    },
    data: { usedAt: now }
  });

  const challenge = await prisma.walletVerificationChallenge.create({
    data: {
      walletId: wallet.id,
      nonce,
      message,
      expiresAt
    }
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "WALLET_CHALLENGE_CREATED",
    entityType: "WALLET",
    entityId: wallet.id,
    payload: {
      challengeId: challenge.id,
      network: wallet.network,
      addressPreview: getWalletAddressPreview(wallet.address),
      addressHash: hashAddress(wallet.address),
      expiresAt: expiresAt.toISOString()
    }
  });

  return {
    walletId: wallet.id,
    challengeId: challenge.id,
    message,
    nonce,
    expiresAt
  };
}

export async function verifyWallet(user: AuthUser, walletIdParam: string, signature: string) {
  const walletId = getRouteIdParam(walletIdParam);
  const wallet = await getOwnedWalletOrThrow(walletId, user.userId);

  const now = new Date();
  const challenge = await prisma.walletVerificationChallenge.findFirst({
    where: {
      walletId: wallet.id,
      usedAt: null,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!challenge)
    throw badRequestError("No active verification challenge. Please request a new challenge.");

  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.getAddress(ethers.verifyMessage(challenge.message, signature));
  } catch {
    recoveredAddress = "";
  }

  if (recoveredAddress !== wallet.address) {
    await prisma.walletVerificationChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: now }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "WALLET_VERIFY_FAILED",
      entityType: "WALLET",
      entityId: wallet.id,
      payload: {
        challengeId: challenge.id,
        network: wallet.network,
        addressPreview: getWalletAddressPreview(wallet.address),
        addressHash: hashAddress(wallet.address)
      }
    });

    throw badRequestError("Wallet signature is invalid");
  }

  const updatedWallet = await prisma.$transaction(async (tx) => {
    await tx.walletVerificationChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: now }
    });

    const existingDefault = await tx.walletAccount.findFirst({
      where: {
        userId: wallet.userId,
        network: wallet.network,
        isDefault: true
      },
      select: { id: true }
    });

    if (!existingDefault) {
      await tx.walletAccount.updateMany({
        where: {
          userId: wallet.userId,
          network: wallet.network
        },
        data: { isDefault: false }
      });
    }

    return tx.walletAccount.update({
      where: { id: wallet.id },
      data: {
        status: WalletStatus.VERIFIED,
        verifiedAt: wallet.verifiedAt ?? now,
        lastVerifiedAt: now,
        isDefault: existingDefault ? wallet.isDefault : true
      }
    });
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "WALLET_VERIFIED",
    entityType: "WALLET",
    entityId: wallet.id,
    payload: {
      challengeId: challenge.id,
      network: wallet.network,
      addressPreview: getWalletAddressPreview(wallet.address),
      addressHash: hashAddress(wallet.address),
      status: WalletStatus.VERIFIED,
      isDefault: updatedWallet.isDefault
    }
  });

  return updatedWallet;
}

export async function setDefaultWallet(user: AuthUser, walletIdParam: string) {
  const walletId = getRouteIdParam(walletIdParam);
  const wallet = await getOwnedWalletOrThrow(walletId, user.userId);

  if (wallet.status !== WalletStatus.VERIFIED) {
    throw badRequestError("Only verified wallet can be set as default");
  }

  const previousDefault = await prisma.walletAccount.findFirst({
    where: {
      userId: wallet.userId,
      network: wallet.network,
      isDefault: true
    },
    select: { id: true, address: true }
  });

  const updatedWallet = await prisma.$transaction(async (tx) => {
    await tx.walletAccount.updateMany({
      where: {
        userId: wallet.userId,
        network: wallet.network
      },
      data: { isDefault: false }
    });
    return tx.walletAccount.update({
      where: { id: wallet.id },
      data: { isDefault: true }
    });
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "WALLET_DEFAULT_CHANGED",
    entityType: "WALLET",
    entityId: wallet.id,
    payload: {
      network: wallet.network,
      oldDefaultWalletId: previousDefault?.id ?? null,
      oldDefaultAddressHash: previousDefault?.address ? hashAddress(previousDefault.address) : null,
      newDefaultWalletId: wallet.id,
      newDefaultAddressHash: hashAddress(wallet.address)
    } satisfies Prisma.InputJsonValue
  });

  return updatedWallet;
}
