import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload
    }
  });
}
