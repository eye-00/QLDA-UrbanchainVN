import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUserInput,
  UserStatusInput
} from "./user.validation.js";

function toUserItem(user: Record<string, unknown>) {
  return {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    identityNumber: user.identityNumber,
    organizationId: user.organizationId,
    organization: user.organization
      ? {
          id: (user.organization as Record<string, string>).id,
          code: (user.organization as Record<string, string>).code,
          name: (user.organization as Record<string, string>).name
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

type UserWhereInput = Record<string, unknown>;

export async function list(data: ListUserInput) {
  const { keyword, role, organizationId, status, page, pageSize } = data;
  const skip = (page - 1) * pageSize;

  const where: UserWhereInput = {
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

  return {
    items: items.map((item: Record<string, unknown>) => toUserItem(item)),
    total
  };
}

export async function create(data: CreateUserInput, actor: AuthenticatedRequest["user"]) {
  try {
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash: hashPassword(data.password),
        role: data.role,
        status: "ACTIVE",
        identityNumber: data.identityNumber,
        organizationId: data.organizationId ?? null
      },
      include: { organization: true }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      payload: {
        role: user.role,
        organizationId: user.organizationId,
        status: user.status
      }
    });

    return toUserItem(user);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2002") {
      throw conflictError("Email already exists");
    }
    if (prismaErr.code === "P2003") {
      throw badRequestError("Organization is invalid");
    }
    throw error;
  }
}

export async function update(
  id: string,
  data: UpdateUserInput,
  actor: AuthenticatedRequest["user"]
) {
  try {
    const previous = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, organizationId: true }
    });
    if (!previous) throw notFoundError("User not found");

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.identityNumber !== undefined ? { identityNumber: data.identityNumber } : {}),
        ...(data.organizationId !== undefined ? { organizationId: data.organizationId } : {})
      },
      include: { organization: true }
    });

    await writeAuditLog({
      actorId: actor.userId,
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
        actorId: actor.userId,
        action: "RBAC_ROLE_UPDATED",
        entityType: "USER",
        entityId: user.id,
        payload: {
          previousRole: previous.role,
          currentRole: user.role
        }
      });
    }

    return toUserItem(user);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2025") {
      throw notFoundError("User not found");
    }
    if (prismaErr.code === "P2002") {
      throw conflictError("Email already exists");
    }
    if (prismaErr.code === "P2003") {
      throw badRequestError("Organization is invalid");
    }
    throw error;
  }
}

export async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { organization: true }
  });
  if (!user) return null;
  return toUserItem(user);
}

export async function updateStatus(
  id: string,
  data: UserStatusInput,
  actor: AuthenticatedRequest["user"]
) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.status === "ACTIVE"
          ? {
              failedLoginAttempts: 0,
              lockedUntil: null
            }
          : {})
      },
      include: { organization: true }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "USER_STATUS_UPDATED",
      entityType: "USER",
      entityId: user.id,
      payload: {
        status: user.status
      }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: data.status === "LOCKED" ? "RBAC_USER_LOCKED" : "RBAC_USER_UNLOCKED",
      entityType: "USER",
      entityId: user.id,
      payload: {
        status: user.status
      }
    });

    return toUserItem(user);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2025") {
      throw notFoundError("User not found");
    }
    throw error;
  }
}
