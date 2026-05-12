import { BlockchainNetwork, ServiceWalletAuthorization, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const serviceWalletRouter = Router();

const managedRoleSchema = z.enum(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]);

const createAuthorizationSchema = z.object({
  walletId: z.string().min(1),
  roleScope: managedRoleSchema,
  chainId: z.coerce.number().int().positive().optional(),
  effectiveTo: z.string().datetime().optional(),
  reason: z.string().min(3).max(191).optional()
});

const updateAuthorizationStatusSchema = z.object({
  status: z.enum(["ACTIVE", "REVOKED", "EXPIRED"]),
  reason: z.string().min(3).max(191).optional()
});

const listQuerySchema = z.object({
  status: z.enum(["ACTIVE", "REVOKED", "EXPIRED"]).optional(),
  network: z.nativeEnum(BlockchainNetwork).optional(),
  roleScope: managedRoleSchema.optional(),
  chainId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

function resolveChainId() {
  const parsed = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  if (!Number.isFinite(parsed) || parsed <= 0) return 11155111;
  return parsed;
}

function mapServiceWalletAuthorization(item: ServiceWalletAuthorization & {
  wallet: { address: string; network: BlockchainNetwork };
  user: { fullName: string; email: string; role: UserRole; organizationId: string | null };
  revokedBy: { id: string; fullName: string } | null;
}) {
  return {
    id: item.id,
    walletId: item.walletId,
    walletAddress: item.wallet.address,
    network: item.network,
    chainId: item.chainId,
    status: item.status,
    roleScope: item.roleScope,
    user: {
      id: item.userId,
      fullName: item.user.fullName,
      email: item.user.email,
      role: item.user.role,
      organizationId: item.user.organizationId
    },
    organizationId: item.organizationId,
    effectiveFrom: item.effectiveFrom,
    effectiveTo: item.effectiveTo,
    reason: item.reason,
    revokedAt: item.revokedAt,
    revokedBy: item.revokedBy
      ? {
          id: item.revokedBy.id,
          fullName: item.revokedBy.fullName
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

serviceWalletRouter.use(requireAuth, requireRoles(["ADMIN"]));

serviceWalletRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const { page, pageSize, status, network, roleScope, chainId } = parsed.data;
    const where = {
      ...(status ? { status } : {}),
      ...(network ? { network } : {}),
      ...(roleScope ? { roleScope } : {}),
      ...(chainId ? { chainId } : {})
    };

    const [items, total] = await Promise.all([
      prisma.serviceWalletAuthorization.findMany({
        where,
        include: {
          wallet: { select: { address: true, network: true } },
          user: { select: { fullName: true, email: true, role: true, organizationId: true } },
          revokedBy: { select: { id: true, fullName: true } }
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.serviceWalletAuthorization.count({ where })
    ]);

    return ok(
      res,
      {
        items: items.map(mapServiceWalletAuthorization),
        total
      },
      "Service wallet authorizations loaded"
    );
  })
);

serviceWalletRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createAuthorizationSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;

    const wallet = await prisma.walletAccount.findUnique({
      where: { id: parsed.data.walletId },
      include: { user: { select: { id: true, role: true, organizationId: true, fullName: true, email: true } } }
    });
    if (!wallet) throw notFoundError("Không tìm thấy ví cần cấp quyền");
    if (wallet.status !== "VERIFIED") throw badRequestError("Chỉ có thể cấp quyền cho ví đã xác minh");
    if (wallet.user.role !== parsed.data.roleScope) {
      throw conflictError("Vai trò tài khoản sở hữu ví không khớp roleScope được cấp");
    }

    const now = new Date();
    const effectiveTo = parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : null;
    if (effectiveTo && Number.isNaN(effectiveTo.getTime())) {
      throw badRequestError("effectiveTo không hợp lệ");
    }
    if (effectiveTo && effectiveTo <= now) {
      throw badRequestError("effectiveTo phải lớn hơn thời điểm hiện tại");
    }

    const chainId = parsed.data.chainId ?? resolveChainId();
    const existingActive = await prisma.serviceWalletAuthorization.findFirst({
      where: {
        walletId: wallet.id,
        network: wallet.network,
        chainId,
        status: "ACTIVE"
      }
    });
    if (existingActive) {
      throw conflictError("Ví này đã có quyền công vụ ACTIVE trên network/chainId hiện tại");
    }

    const createdItem = await prisma.serviceWalletAuthorization.create({
      data: {
        walletId: wallet.id,
        userId: wallet.user.id,
        organizationId: wallet.user.organizationId ?? null,
        roleScope: parsed.data.roleScope,
        network: wallet.network,
        chainId,
        status: "ACTIVE",
        effectiveFrom: now,
        effectiveTo,
        reason: parsed.data.reason ?? null
      },
      include: {
        wallet: { select: { address: true, network: true } },
        user: { select: { fullName: true, email: true, role: true, organizationId: true } },
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
        walletAddress: createdItem.wallet.address,
        userId: createdItem.userId,
        roleScope: createdItem.roleScope,
        network: createdItem.network,
        chainId: createdItem.chainId,
        effectiveTo: createdItem.effectiveTo
      }
    });

    return created(res, mapServiceWalletAuthorization(createdItem), "Đã cấp quyền ví công vụ");
  })
);

serviceWalletRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const parsed = updateAuthorizationStatusSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;

    const existing = await prisma.serviceWalletAuthorization.findUnique({
      where: { id: String(req.params.id) },
      include: {
        wallet: { select: { address: true, network: true } },
        user: { select: { fullName: true, email: true, role: true, organizationId: true } },
        revokedBy: { select: { id: true, fullName: true } }
      }
    });
    if (!existing) throw notFoundError("Không tìm thấy quyền ví công vụ");

    const now = new Date();
    const updated = await prisma.serviceWalletAuthorization.update({
      where: { id: existing.id },
      data: {
        status: parsed.data.status,
        reason: parsed.data.reason ?? existing.reason,
        revokedAt: parsed.data.status === "REVOKED" ? now : existing.revokedAt,
        revokedById: parsed.data.status === "REVOKED" ? actor.userId : existing.revokedById
      },
      include: {
        wallet: { select: { address: true, network: true } },
        user: { select: { fullName: true, email: true, role: true, organizationId: true } },
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
        walletAddress: updated.wallet.address,
        network: updated.network,
        chainId: updated.chainId,
        reason: parsed.data.reason ?? null
      }
    });

    return ok(res, mapServiceWalletAuthorization(updated), "Đã cập nhật trạng thái ví công vụ");
  })
);

serviceWalletRouter.get(
  "/:id/audit",
  asyncHandler(async (req, res) => {
    const item = await prisma.serviceWalletAuthorization.findUnique({
      where: { id: String(req.params.id) }
    });
    if (!item) throw notFoundError("Không tìm thấy quyền ví công vụ");

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "SERVICE_WALLET_AUTHORIZATION",
        entityId: item.id
      },
      orderBy: { createdAt: "desc" }
    });

    return ok(
      res,
      {
        items: logs.map((log) => ({
          id: log.id,
          action: log.action,
          actorId: log.actorId,
          payload: log.payload,
          createdAt: log.createdAt
        })),
        total: logs.length
      },
      "Đã tải nhật ký ví công vụ"
    );
  })
);

export { serviceWalletRouter };
