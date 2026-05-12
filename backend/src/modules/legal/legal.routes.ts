import { Prisma, UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler, badRequestError, notFoundError } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";

const legalProcedureUpsertSchema = z.object({
  procedureCode: z.string().min(3),
  name: z.string().min(3),
  sourceDecision: z.string().min(3).optional(),
  legalBasis: z.string().min(3),
  level: z.string().min(2),
  authorityActors: z.array(
    z.enum([
      "CITIZEN",
      "BUSINESS",
      "RECEPTION_OFFICER",
      "COMMUNE_OFFICER",
      "LAND_REGISTRY_OFFICER",
      "TAX_OFFICER",
      "APPROVAL_AUTHORITY",
      "AUDITOR",
      "ADMIN"
    ])
  ),
  requiresTaxStep: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

function toProcedureItem(item: {
  id: string;
  procedureCode: string;
  name: string;
  sourceDecision: string | null;
  legalBasis: string;
  level: string;
  authorityActors: Prisma.JsonValue;
  requiresTaxStep: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    procedureCode: item.procedureCode,
    name: item.name ?? item.procedureCode,
    sourceDecision: item.sourceDecision,
    legalBasis: item.legalBasis,
    level: item.level,
    authorityActors: Array.isArray(item.authorityActors)
      ? item.authorityActors.filter((actor): actor is string => typeof actor === "string")
      : [],
    requiresTaxStep: item.requiresTaxStep,
    isActive: item.isActive,
    updatedAt: item.updatedAt
  };
}

export const legalRouter = Router();

legalRouter.use(requireAuth);

legalRouter.get(
  "/procedures",
  requireRoles(AUTH_ROLES.officers),
  asyncHandler(async (_req, res) => {
    const items = await prisma.legalProcedure.findMany({
      where: { isActive: true },
      orderBy: { procedureCode: "asc" }
    });
    return ok(res, { items: items.map((item) => toProcedureItem(item)), total: items.length });
  })
);

legalRouter.get(
  "/procedures/:procedureCode",
  requireRoles(AUTH_ROLES.officers),
  asyncHandler(async (req, res) => {
    const item = await prisma.legalProcedure.findUnique({
      where: { procedureCode: String(req.params.procedureCode) }
    });
    if (!item) throw notFoundError("Không tìm thấy thủ tục pháp lý");
    return ok(res, toProcedureItem(item));
  })
);

legalRouter.get(
  "/authority-matrix",
  requireRoles(AUTH_ROLES.officers),
  asyncHandler(async (_req, res) => {
    const items = await prisma.legalProcedure.findMany({
      where: { isActive: true },
      orderBy: { procedureCode: "asc" }
    });
    const matrix = items.map((item) => ({
      procedureCode: item.procedureCode,
      authorityActors: Array.isArray(item.authorityActors)
        ? item.authorityActors.filter((actor): actor is UserRole => typeof actor === "string") as UserRole[]
        : [],
      requiresTaxStep: item.requiresTaxStep
    }));
    return ok(res, { items: matrix, total: matrix.length });
  })
);

legalRouter.post(
  "/procedures/upsert",
  requireRoles(AUTH_ROLES.admin),
  asyncHandler(async (req, res) => {
    const parsed = legalProcedureUpsertSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const data = parsed.data;
    const item = await prisma.legalProcedure.upsert({
      where: { procedureCode: data.procedureCode },
      update: {
        name: data.name,
        sourceDecision: data.sourceDecision ?? "N/A",
        legalBasis: data.legalBasis,
        level: data.level,
        authorityActors: data.authorityActors,
        requiresTaxStep: data.requiresTaxStep,
        isActive: data.isActive
      },
      create: {
        procedureCode: data.procedureCode,
        name: data.name,
        sourceDecision: data.sourceDecision ?? "N/A",
        legalBasis: data.legalBasis,
        level: data.level,
        authorityActors: data.authorityActors,
        requiresTaxStep: data.requiresTaxStep,
        isActive: data.isActive
      }
    });

    return ok(res, toProcedureItem(item), "Đã cập nhật danh mục thủ tục pháp lý");
  })
);
