import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const listSchema = z.object({
  keyword: z.string().optional(),
  includeInactive: z.preprocess((value) => {
    if (typeof value === "string") return value.toLowerCase() === "true";
    return value;
  }, z.boolean().default(false))
});

const createSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional()
});

const updateSchema = z.object({
  code: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

function toOrganizationItem(org: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { users: number };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: org.id,
    code: org.code,
    name: org.name,
    description: org.description,
    isActive: org.isActive,
    userCount: org._count?.users ?? 0,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt
  };
}

export const organizationRouter = Router();

organizationRouter.use(requireAuth, requireRoles(AUTH_ROLES.admin));

organizationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const where: Prisma.OrganizationWhereInput = {
      ...(parsed.data.includeInactive ? {} : { isActive: true }),
      ...(parsed.data.keyword
        ? {
            OR: [
              { code: { contains: parsed.data.keyword } },
              { name: { contains: parsed.data.keyword } }
            ]
          }
        : {})
    };

    const items = await prisma.organization.findMany({
      where,
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" }
    });
    return ok(res, { items: items.map((item) => toOrganizationItem(item)), total: items.length });
  })
);

organizationRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    try {
      const authUser = (req as AuthenticatedRequest).user;
      const org = await prisma.organization.create({
        data: {
          code: parsed.data.code.toUpperCase(),
          name: parsed.data.name,
          description: parsed.data.description,
          isActive: true
        },
        include: { _count: { select: { users: true } } }
      });
      await writeAuditLog({
        actorId: authUser.userId,
        action: "ORGANIZATION_CREATED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        payload: {
          code: org.code,
          isActive: org.isActive
        }
      });
      return created(res, toOrganizationItem(org));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflictError("Organization code already exists");
      }
      throw error;
    }
  })
);

organizationRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    try {
      const authUser = (req as AuthenticatedRequest).user;
      const org = await prisma.organization.update({
        where: { id: String(req.params.id) },
        data: {
          ...(parsed.data.code !== undefined ? { code: parsed.data.code.toUpperCase() } : {}),
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
          ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {})
        },
        include: { _count: { select: { users: true } } }
      });
      await writeAuditLog({
        actorId: authUser.userId,
        action: "ORGANIZATION_UPDATED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        payload: {
          code: org.code,
          isActive: org.isActive
        }
      });
      return ok(res, toOrganizationItem(org));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFoundError("Organization not found");
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflictError("Organization code already exists");
      }
      throw error;
    }
  })
);

organizationRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      const org = await prisma.organization.update({
        where: { id: String(req.params.id) },
        data: { isActive: false },
        include: { _count: { select: { users: true } } }
      });
      await writeAuditLog({
        actorId: authUser.userId,
        action: "ORGANIZATION_DEACTIVATED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        payload: {
          code: org.code,
          isActive: org.isActive
        }
      });
      return ok(res, toOrganizationItem(org), "Organization deactivated");
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFoundError("Organization not found");
      }
      throw error;
    }
  })
);
