import { prisma } from "../../lib/prisma.js";
import type { AuditQueryInput } from "./audit.validation.js";

type AuditLogWhereInput = Record<string, unknown>;

function buildCommonWhere(input: AuditQueryInput): AuditLogWhereInput {
  const where: AuditLogWhereInput = {};
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

async function fetchAuditLogs(query: AuditQueryInput, where: AuditLogWhereInput) {
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

export async function queryAccessLogs(data: AuditQueryInput) {
  const where = buildCommonWhere(data);
  where.action = data.action ? { contains: data.action } : { startsWith: "AUTH_" };
  return fetchAuditLogs(data, where);
}

export async function queryUserActions(data: AuditQueryInput) {
  const where = buildCommonWhere(data);
  where.OR = [
    { action: { startsWith: "USER_" } },
    { action: { startsWith: "REGISTRATION_" } },
    { action: { startsWith: "TRANSFER_" } },
    { action: { startsWith: "FILE_" } },
    { action: { startsWith: "AUTH_PASSWORD_" } },
    { action: { startsWith: "WALLET_" } }
  ];
  if (data.action) where.action = { contains: data.action };
  return fetchAuditLogs(data, where);
}

export async function queryRbacChanges(data: AuditQueryInput) {
  const where = buildCommonWhere(data);
  where.action = data.action ? { contains: data.action } : { startsWith: "RBAC_" };
  return fetchAuditLogs(data, where);
}
