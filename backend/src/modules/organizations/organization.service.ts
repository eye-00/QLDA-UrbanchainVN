import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type { CreateOrgInput, UpdateOrgInput, ListOrgInput } from "./organization.validation.js";

function toOrganizationItem(org: Record<string, unknown>) {
  return {
    id: org.id,
    code: org.code,
    name: org.name,
    description: org.description,
    isActive: org.isActive,
    userCount: (org._count as Record<string, number>)?.users ?? 0,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt
  };
}

type OrganizationWhereInput = Record<string, unknown>;

export async function list(data: ListOrgInput) {
  const where: OrganizationWhereInput = {
    ...(data.includeInactive ? {} : { isActive: true }),
    ...(data.keyword
      ? {
          OR: [{ code: { contains: data.keyword } }, { name: { contains: data.keyword } }]
        }
      : {})
  };

  const items = await prisma.organization.findMany({
    where,
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" }
  });

  return {
    items: items.map((item: Record<string, unknown>) => toOrganizationItem(item)),
    total: items.length
  };
}

export async function create(data: CreateOrgInput, actor: AuthenticatedRequest["user"]) {
  try {
    const org = await prisma.organization.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        isActive: true
      },
      include: { _count: { select: { users: true } } }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      payload: {
        code: org.code,
        isActive: org.isActive
      }
    });

    return toOrganizationItem(org);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2002") {
      throw conflictError("Organization code already exists");
    }
    throw error;
  }
}

export async function update(
  id: string,
  data: UpdateOrgInput,
  actor: AuthenticatedRequest["user"]
) {
  try {
    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.code !== undefined ? { code: data.code.toUpperCase() } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
      },
      include: { _count: { select: { users: true } } }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "ORGANIZATION_UPDATED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      payload: {
        code: org.code,
        isActive: org.isActive
      }
    });

    return toOrganizationItem(org);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2025") {
      throw notFoundError("Organization not found");
    }
    if (prismaErr.code === "P2002") {
      throw conflictError("Organization code already exists");
    }
    throw error;
  }
}

export async function getById(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } }
  });
  if (!org) throw notFoundError("Organization not found");
  return toOrganizationItem(org);
}

export async function deactivate(id: string, actor: AuthenticatedRequest["user"]) {
  try {
    const org = await prisma.organization.update({
      where: { id },
      data: { isActive: false },
      include: { _count: { select: { users: true } } }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "ORGANIZATION_DEACTIVATED",
      entityType: "ORGANIZATION",
      entityId: org.id,
      payload: {
        code: org.code,
        isActive: org.isActive
      }
    });

    return toOrganizationItem(org);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2025") {
      throw notFoundError("Organization not found");
    }
    throw error;
  }
}
