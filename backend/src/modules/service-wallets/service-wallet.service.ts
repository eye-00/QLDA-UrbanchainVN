import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type {
  CreateAuthorizationInput,
  UpdateAuthorizationInput,
  ListAuthorizationInput
} from "./service-wallet.validation.js";

function resolveChainId() {
  const parsed = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  if (!Number.isFinite(parsed) || parsed <= 0) return 11155111;
  return parsed;
}

function mapServiceWalletAuthorization(item: Record<string, unknown>) {
  const wallet = item.wallet as Record<string, string>;
  const user = item.user as Record<string, unknown>;
  const revokedBy = item.revokedBy as Record<string, string> | null;
  return {
    id: item.id,
    walletId: item.walletId,
    walletAddress: wallet?.address,
    network: item.network,
    chainId: item.chainId,
    status: item.status,
    roleScope: item.roleScope,
    user: {
      id: item.userId,
      fullName: user?.fullName,
      email: user?.email,
      role: user?.role,
      organizationId: user?.organizationId
    },
    organizationId: item.organizationId,
    effectiveFrom: item.effectiveFrom,
    effectiveTo: item.effectiveTo,
    reason: item.reason,
    revokedAt: item.revokedAt,
    revokedBy: revokedBy
      ? {
          id: revokedBy.id,
          fullName: revokedBy.fullName
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export async function list(data: ListAuthorizationInput) {
  const { page, pageSize, status, network, roleScope, organizationId, chainId } = data;
  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(network ? { network } : {}),
    ...(roleScope ? { roleScope } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(chainId ? { chainId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.serviceWalletAuthorization.findMany({
      where,
      include: {
        wallet: { select: { address: true, network: true } },
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
            organizationId: true
          }
        },
        revokedBy: { select: { id: true, fullName: true } }
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.serviceWalletAuthorization.count({ where })
  ]);

  return {
    items: items.map(mapServiceWalletAuthorization),
    total
  };
}

export async function create(data: CreateAuthorizationInput, actor: AuthenticatedRequest["user"]) {
  const wallet = await prisma.walletAccount.findUnique({
    where: { id: data.walletId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          organizationId: true,
          fullName: true,
          email: true
        }
      }
    }
  });
  if (!wallet) throw notFoundError("Không tìm thấy ví cần cấp quyền");
  if (wallet.status !== "VERIFIED")
    throw badRequestError("Chỉ có thể cấp quyền cho ví đã xác minh");
  const walletUser = wallet.user as unknown as {
    role: string;
    id: string;
    organizationId: string | null;
    fullName: string;
    email: string;
  };
  if (walletUser.role !== data.roleScope) {
    throw conflictError("Vai trò tài khoản sở hữu ví không khớp roleScope được cấp");
  }

  const now = new Date();
  const effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : null;
  if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
    throw badRequestError("effectiveTo không hợp lệ");
  }
  if (effectiveTo && effectiveTo <= now) {
    throw badRequestError("effectiveTo phải lớn hơn thời điểm hiện tại");
  }

  const chainId = data.chainId ?? resolveChainId();

  const createdItem = await prisma.serviceWalletAuthorization.create({
    data: {
      walletId: wallet.id,
      userId: walletUser.id,
      organizationId: walletUser.organizationId ?? null,
      roleScope: data.roleScope,
      network: wallet.network,
      chainId,
      status: "ACTIVE",
      effectiveFrom: now,
      effectiveTo,
      reason: data.reason ?? null
    },
    include: {
      wallet: { select: { address: true, network: true } },
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
          organizationId: true
        }
      },
      revokedBy: { select: { id: true, fullName: true } }
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "SERVICE_WALLET_GRANTED",
    entityType: "SERVICE_WALLET_AUTHORIZATION",
    entityId: createdItem.id,
    payload: {
      walletId: createdItem.walletId,
      walletAddress: (createdItem.wallet as unknown as { address: string }).address,
      userId: createdItem.userId,
      roleScope: createdItem.roleScope,
      network: createdItem.network,
      chainId: createdItem.chainId,
      effectiveTo: createdItem.effectiveTo
    }
  });

  return mapServiceWalletAuthorization(createdItem as unknown as Record<string, unknown>);
}

export async function update(
  id: string,
  data: UpdateAuthorizationInput,
  actor: AuthenticatedRequest["user"]
) {
  const existing = await prisma.serviceWalletAuthorization.findUnique({
    where: { id },
    include: {
      wallet: { select: { address: true, network: true } },
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
          organizationId: true
        }
      },
      revokedBy: { select: { id: true, fullName: true } }
    }
  });
  if (!existing) throw notFoundError("Không tìm thấy quyền ví công vụ");

  const now = new Date();
  const updated = await prisma.serviceWalletAuthorization.update({
    where: { id: existing.id },
    data: {
      status: data.status,
      reason: data.reason ?? existing.reason,
      revokedAt: data.status === "REVOKED" ? now : existing.revokedAt,
      revokedById: data.status === "REVOKED" ? actor.userId : existing.revokedById
    },
    include: {
      wallet: { select: { address: true, network: true } },
      user: {
        select: {
          fullName: true,
          email: true,
          role: true,
          organizationId: true
        }
      },
      revokedBy: { select: { id: true, fullName: true } }
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: updated.status === "REVOKED" ? "SERVICE_WALLET_REVOKED" : "SERVICE_WALLET_UPDATED",
    entityType: "SERVICE_WALLET_AUTHORIZATION",
    entityId: updated.id,
    payload: {
      previousStatus: existing.status,
      status: updated.status,
      roleScope: updated.roleScope,
      walletAddress: (updated.wallet as unknown as { address: string }).address,
      network: updated.network,
      chainId: updated.chainId,
      reason: data.reason ?? null
    }
  });

  return mapServiceWalletAuthorization(updated as unknown as Record<string, unknown>);
}

export async function getAuditLogs(id: string) {
  const item = await prisma.serviceWalletAuthorization.findUnique({
    where: { id }
  });
  if (!item) throw notFoundError("Không tìm thấy quyền ví công vụ");

  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: "SERVICE_WALLET_AUTHORIZATION",
      entityId: item.id
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    items: logs.map((log: Record<string, unknown>) => ({
      id: log.id,
      action: log.action,
      actorId: log.actorId,
      payload: log.payload,
      createdAt: log.createdAt
    })),
    total: logs.length
  };
}

export async function revoke(id: string, actor: AuthenticatedRequest["user"]) {
  return update(id, { status: "REVOKED" }, actor);
}
