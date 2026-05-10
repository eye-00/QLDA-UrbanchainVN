import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/password.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const roleSchema = z.enum([
  "CITIZEN",
  "BUSINESS",
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "TAX_OFFICER",
  "AUDITOR",
  "ADMIN"
]);

const statusSchema = z.enum(["ACTIVE", "LOCKED"]);

const listUsersSchema = z.object({
  keyword: z.string().optional(),
  role: roleSchema.optional(),
  organizationId: z.string().optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleSchema,
  identityNumber: z.string().optional(),
  organizationId: z.string().nullable().optional()
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: roleSchema.optional(),
  identityNumber: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional()
});

const updateStatusSchema = z.object({
  status: statusSchema
});

function toUserItem(user: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  identityNumber: string | null;
  organizationId: string | null;
  organization?: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    identityNumber: user.identityNumber,
    organizationId: user.organizationId,
    organization: user.organization
      ? { id: user.organization.id, code: user.organization.code, name: user.organization.name }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export const userRouter = Router();

userRouter.use(requireAuth, requireRoles(AUTH_ROLES.admin));

userRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listUsersSchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const { keyword, role, organizationId, status, page, pageSize } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { fullName: { contains: keyword } },
              { email: { contains: keyword } },
              { identityNumber: { contains: keyword } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { organization: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);

    return ok(res, {
      items: items.map((item) => toUserItem(item)),
      total
    });
  })
);

userRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    try {
      const authUser = (req as AuthenticatedRequest).user;
      const user = await prisma.user.create({
        data: {
          fullName: parsed.data.fullName,
          email: parsed.data.email.toLowerCase(),
          passwordHash: hashPassword(parsed.data.password),
          role: parsed.data.role,
          status: "ACTIVE",
          identityNumber: parsed.data.identityNumber,
          organizationId: parsed.data.organizationId ?? null
        },
        include: { organization: true }
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: user.id,
        payload: {
          role: user.role,
          organizationId: user.organizationId,
          status: user.status
        }
      });

      return created(res, toUserItem(user), "Created successfully");
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflictError("Email already exists");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw badRequestError("Organization is invalid");
      }
      throw error;
    }
  })
);

userRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    try {
      const authUser = (req as AuthenticatedRequest).user;
      const previous = await prisma.user.findUnique({
        where: { id: String(req.params.id) },
        select: { id: true, role: true, organizationId: true }
      });
      if (!previous) throw notFoundError("User not found");

      const user = await prisma.user.update({
        where: { id: String(req.params.id) },
        data: {
          ...(parsed.data.fullName !== undefined ? { fullName: parsed.data.fullName } : {}),
          ...(parsed.data.email !== undefined ? { email: parsed.data.email.toLowerCase() } : {}),
          ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
          ...(parsed.data.identityNumber !== undefined ? { identityNumber: parsed.data.identityNumber } : {}),
          ...(parsed.data.organizationId !== undefined ? { organizationId: parsed.data.organizationId } : {})
        },
        include: { organization: true }
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: "USER_UPDATED",
        entityType: "USER",
        entityId: user.id,
        payload: {
          previousRole: previous.role,
          role: user.role,
          previousOrganizationId: previous.organizationId,
          organizationId: user.organizationId
        }
      });

      if (previous.role !== user.role) {
        await writeAuditLog({
          actorId: authUser.userId,
          action: "RBAC_ROLE_UPDATED",
          entityType: "USER",
          entityId: user.id,
          payload: {
            previousRole: previous.role,
            currentRole: user.role
          }
        });
      }

      return ok(res, toUserItem(user));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFoundError("User not found");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflictError("Email already exists");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw badRequestError("Organization is invalid");
      }
      throw error;
    }
  })
);

userRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    try {
      const authUser = (req as AuthenticatedRequest).user;
      const user = await prisma.user.update({
        where: { id: String(req.params.id) },
        data: {
          status: parsed.data.status,
          ...(parsed.data.status === "ACTIVE"
            ? {
                failedLoginAttempts: 0,
                lockedUntil: null
              }
            : {})
        },
        include: { organization: true }
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: "USER_STATUS_UPDATED",
        entityType: "USER",
        entityId: user.id,
        payload: {
          status: user.status
        }
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: parsed.data.status === "LOCKED" ? "RBAC_USER_LOCKED" : "RBAC_USER_UNLOCKED",
        entityType: "USER",
        entityId: user.id,
        payload: {
          status: user.status
        }
      });

      return ok(res, toUserItem(user));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFoundError("User not found");
      }
      throw error;
    }
  })
);
