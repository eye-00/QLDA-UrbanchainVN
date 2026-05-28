import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { ok } from "../../lib/response.js";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";

const AUDIT_VIEW_ROLES: UserRole[] = ["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "AUDITOR", "ADMIN"];

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  actorId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const auditRouter = Router();

auditRouter.use(requireAuth, requireRoles(AUDIT_VIEW_ROLES));

function buildCommonWhere(input: z.infer<typeof listQuerySchema>): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (input.actorId) where.actorId = input.actorId;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.action) where.action = { contains: input.action };
  if (input.from || input.to) {
    where.createdAt = {
      ...(input.from ? { gte: input.from } : {}),
      ...(input.to ? { lte: input.to } : {})
    };
  }
  return where;
}

async function fetchAuditLogs(
  query: z.infer<typeof listQuerySchema>,
  where: Prisma.AuditLogWhereInput
) {
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

auditRouter.get(
  "/access-logs",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const where = buildCommonWhere(parsed.data);
    where.action = parsed.data.action
      ? { contains: parsed.data.action }
      : { startsWith: "AUTH_" };
    return ok(res, await fetchAuditLogs(parsed.data, where));
  })
);

auditRouter.get(
  "/user-actions",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const where = buildCommonWhere(parsed.data);
    where.OR = [
      { action: { startsWith: "USER_" } },
      { action: { startsWith: "REGISTRATION_" } },
      { action: { startsWith: "TRANSFER_" } },
      { action: { startsWith: "FILE_" } },
      { action: { startsWith: "AUTH_PASSWORD_" } },
      { action: { startsWith: "WALLET_" } }
    ];
    if (parsed.data.action) where.action = { contains: parsed.data.action };
    return ok(res, await fetchAuditLogs(parsed.data, where));
  })
);

auditRouter.get(
  "/rbac-changes",
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
    const where = buildCommonWhere(parsed.data);
    where.action = parsed.data.action
      ? { contains: parsed.data.action }
      : { startsWith: "RBAC_" };
    return ok(res, await fetchAuditLogs(parsed.data, where));
  })
);
