import { randomBytes, createHash } from "node:crypto";
import { BlockchainNetwork, Prisma, UserRole, WalletAccount, WalletStatus } from "@prisma/client";
import { Router } from "express";
import { ethers } from "ethers";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { created, ok } from "../../lib/response.js";
import { AuthenticatedRequest, requireAuth, requireRoles } from "../auth/auth.middleware.js";

const walletRouter = Router();

const WALLET_MANAGE_ROLES: UserRole[] = ["CITIZEN", "BUSINESS"];
const WALLET_NONCE_TTL_MINUTES = Number(process.env.WALLET_NONCE_TTL_MINUTES || 10);

const connectWalletSchema = z.object({
  address: z.string().min(1),
  network: z.nativeEnum(BlockchainNetwork)
});

const verifyWalletSchema = z.object({
  signature: z.string().min(20)
});

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

function toWalletResponse(wallet: WalletAccount) {
  return {
    id: wallet.id,
    address: wallet.address,
    addressShort: getWalletAddressPreview(wallet.address),
    network: wallet.network,
    status: wallet.status,
    isDefault: wallet.isDefault,
    verifiedAt: wallet.verifiedAt,
    lastVerifiedAt: wallet.lastVerifiedAt,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  };
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
  const wallet = await prisma.walletAccount.findUnique({ where: { id: walletId } });
  if (!wallet) throw notFoundError("Wallet not found");
  if (wallet.userId !== userId) throw forbiddenError("Cannot access another user's wallet");
  return wallet;
}

walletRouter.use(requireAuth, requireRoles(WALLET_MANAGE_ROLES));

walletRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user.userId;
    const wallets = await prisma.walletAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
    });

    return ok(res, {
      items: wallets.map(toWalletResponse),
      total: wallets.length
    });
  })
);

walletRouter.post(
  "/connect",
  asyncHandler(async (req, res) => {
    const parsed = connectWalletSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const normalizedAddress = normalizeWalletAddress(parsed.data.address);

    const existing = await prisma.walletAccount.findFirst({
      where: {
        network: parsed.data.network,
        address: normalizedAddress
      }
    });

    if (existing && existing.userId !== user.userId) {
      await writeAuditLog({
        actorId: user.userId,
        action: "WALLET_CONNECT_CONFLICT",
        entityType: "WALLET",
        entityId: `${parsed.data.network}:${normalizedAddress}`,
        payload: {
          network: parsed.data.network,
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
      return ok(res, toWalletResponse(existing), "Wallet already linked");
    }

    const wallet = await prisma.walletAccount.create({
      data: {
        userId: user.userId,
        address: normalizedAddress,
        network: parsed.data.network,
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

    return created(res, toWalletResponse(wallet), "Wallet linked. Verification is required.");
  })
);

walletRouter.post(
  "/:id/challenge",
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const walletId = getRouteIdParam(req.params.id);
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

    return ok(
      res,
      {
        walletId: wallet.id,
        challengeId: challenge.id,
        message,
        nonce,
        expiresAt
      },
      "Verification challenge created"
    );
  })
);

walletRouter.post(
  "/:id/verify",
  asyncHandler(async (req, res) => {
    const parsed = verifyWalletSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const walletId = getRouteIdParam(req.params.id);
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

    if (!challenge) throw badRequestError("No active verification challenge. Please request a new challenge.");

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.getAddress(ethers.verifyMessage(challenge.message, parsed.data.signature));
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

    return ok(res, toWalletResponse(updatedWallet), "Wallet verified successfully");
  })
);

walletRouter.patch(
  "/:id/default",
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const walletId = getRouteIdParam(req.params.id);
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

    return ok(res, toWalletResponse(updatedWallet), "Default wallet updated");
  })
);

export { walletRouter };
