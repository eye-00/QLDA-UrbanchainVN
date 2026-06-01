import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

export interface AuditEvent {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
}

export async function writeAuditLog(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      actorId: event.actorId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: (event.payload ?? Prisma.DbNull) as Prisma.InputJsonValue
    }
  });
}
