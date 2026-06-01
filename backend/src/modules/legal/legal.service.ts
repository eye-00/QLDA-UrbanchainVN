import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type { CreateLegalInput, UpdateLegalInput, ListLegalInput } from "./legal.validation.js";

function toItem(item: Record<string, unknown>) {
  return {
    id: item.id,
    procedureCode: item.procedureCode,
    sourceDecision: item.sourceDecision,
    legalBasis: item.legalBasis,
    level: item.level,
    authorityActors: Array.isArray(item.authorityActors) ? item.authorityActors : [],
    requiresTaxStep: item.requiresTaxStep,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

type LegalProcedureWhereInput = Record<string, unknown>;

export async function list(data: ListLegalInput) {
  const { keyword, level, isActive, page, pageSize } = data;
  const skip = (page - 1) * pageSize;
  const where: LegalProcedureWhereInput = {
    ...(level ? { level } : {}),
    ...(isActive === undefined ? {} : { isActive }),
    ...(keyword
      ? {
          OR: [
            { procedureCode: { contains: keyword } },
            { sourceDecision: { contains: keyword } },
            { legalBasis: { contains: keyword } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.legalProcedure.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { procedureCode: "asc" }],
      skip,
      take: pageSize
    }),
    prisma.legalProcedure.count({ where })
  ]);

  return {
    items: items.map((item: Record<string, unknown>) => toItem(item)),
    total,
    page,
    pageSize
  };
}

export async function getById(procedureCode: string) {
  const item = await prisma.legalProcedure.findUnique({
    where: { procedureCode }
  });
  if (!item) throw notFoundError("Không tìm thấy thủ tục pháp lý");
  return toItem(item);
}

export async function create(data: CreateLegalInput, actor: AuthenticatedRequest["user"]) {
  try {
    const createdProcedure = await prisma.legalProcedure.create({
      data: {
        procedureCode: data.procedureCode.trim().toUpperCase(),
        sourceDecision: data.sourceDecision.trim(),
        legalBasis: data.legalBasis.trim(),
        level: data.level,
        authorityActors: data.authorityActors,
        requiresTaxStep: data.requiresTaxStep
      }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "LEGAL_PROCEDURE_CREATED",
      entityType: "LEGAL_PROCEDURE",
      entityId: createdProcedure.id,
      payload: {
        procedureCode: createdProcedure.procedureCode,
        level: createdProcedure.level
      }
    });

    return toItem(createdProcedure);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2002") {
      throw conflictError("Mã thủ tục pháp lý đã tồn tại");
    }
    throw error;
  }
}

export async function update(
  id: string,
  data: UpdateLegalInput,
  actor: AuthenticatedRequest["user"]
) {
  const existing = await prisma.legalProcedure.findUnique({ where: { id } });
  if (!existing) throw notFoundError("Không tìm thấy thủ tục pháp lý");

  const item = await prisma.legalProcedure.update({
    where: { id },
    data: {
      ...(data.sourceDecision !== undefined ? { sourceDecision: data.sourceDecision.trim() } : {}),
      ...(data.legalBasis !== undefined ? { legalBasis: data.legalBasis.trim() } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.authorityActors !== undefined ? { authorityActors: data.authorityActors } : {}),
      ...(data.requiresTaxStep !== undefined ? { requiresTaxStep: data.requiresTaxStep } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "LEGAL_PROCEDURE_UPDATED",
    entityType: "LEGAL_PROCEDURE",
    entityId: item.id,
    payload: {
      procedureCode: item.procedureCode,
      previousIsActive: existing.isActive,
      isActive: item.isActive
    }
  });

  return toItem(item);
}

export async function search(query: string) {
  const items = await prisma.legalProcedure.findMany({
    where: {
      OR: [
        { procedureCode: { contains: query } },
        { sourceDecision: { contains: query } },
        { legalBasis: { contains: query } }
      ]
    },
    orderBy: [{ isActive: "desc" }, { procedureCode: "asc" }]
  });

  return {
    items: items.map((item: Record<string, unknown>) => toItem(item)),
    total: items.length
  };
}
