import { Prisma, ProcedureLevel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import {
  asyncHandler,
  badRequestError,
  conflictError,
  notFoundError,
} from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import {
  AUTH_ROLES,
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from "../auth/auth.middleware.js";

const authorityActorSchema = z.enum([
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "TAX_OFFICER",
  "AUDITOR",
  "ADMIN",
]);

const levelSchema = z.enum(["XA", "TINH", "LIEN_THONG"]);

const listSchema = z.object({
  keyword: z.string().optional(),
  level: levelSchema.optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (typeof value === "boolean") return value;
      return value === "true";
    }),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const createSchema = z.object({
  procedureCode: z.string().min(3).max(64),
  sourceDecision: z.string().min(3),
  legalBasis: z.string().min(3),
  level: levelSchema,
  authorityActors: z.array(authorityActorSchema).min(1),
  requiresTaxStep: z.boolean().default(false),
});

const updateSchema = z.object({
  sourceDecision: z.string().min(3).optional(),
  legalBasis: z.string().min(3).optional(),
  level: levelSchema.optional(),
  authorityActors: z.array(authorityActorSchema).min(1).optional(),
  requiresTaxStep: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

function toItem(item: {
  id: string;
  procedureCode: string;
  sourceDecision: string;
  legalBasis: string;
  level: ProcedureLevel;
  authorityActors: Prisma.JsonValue;
  requiresTaxStep: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    procedureCode: item.procedureCode,
    sourceDecision: item.sourceDecision,
    legalBasis: item.legalBasis,
    level: item.level,
    authorityActors: Array.isArray(item.authorityActors)
      ? item.authorityActors
      : [],
    requiresTaxStep: item.requiresTaxStep,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const legalRouter = Router();

legalRouter.use(requireAuth);

legalRouter.get(
  "/procedures",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const { keyword, level, isActive, page, pageSize } = parsed.data;
    const skip = (page - 1) * pageSize;
    const where: Prisma.LegalProcedureWhereInput = {
      ...(level ? { level } : {}),
      ...(isActive === undefined ? {} : { isActive }),
      ...(keyword
        ? {
            OR: [
              { procedureCode: { contains: keyword } },
              { sourceDecision: { contains: keyword } },
              { legalBasis: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.legalProcedure.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { procedureCode: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.legalProcedure.count({ where }),
    ]);

    return ok(res, {
      items: items.map((item) => toItem(item)),
      total,
      page,
      pageSize,
    });
  }),
);

legalRouter.get(
  "/procedures/:procedureCode",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  asyncHandler(async (req, res) => {
    const procedureCode = String(req.params.procedureCode);
    const item = await prisma.legalProcedure.findUnique({
      where: { procedureCode },
    });
    if (!item) throw notFoundError("Không tìm thấy thủ tục pháp lý");
    return ok(res, toItem(item));
  }),
);

legalRouter.post(
  "/procedures",
  requireRoles(AUTH_ROLES.admin),
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    try {
      const actor = (req as AuthenticatedRequest).user;
      const createdProcedure = await prisma.legalProcedure.create({
        data: {
          procedureCode: parsed.data.procedureCode.trim().toUpperCase(),
          sourceDecision: parsed.data.sourceDecision.trim(),
          legalBasis: parsed.data.legalBasis.trim(),
          level: parsed.data.level,
          authorityActors: parsed.data.authorityActors,
          requiresTaxStep: parsed.data.requiresTaxStep,
        },
      });

      await writeAuditLog({
        actorId: actor.userId,
        action: "LEGAL_PROCEDURE_CREATED",
        entityType: "LEGAL_PROCEDURE",
        entityId: createdProcedure.id,
        payload: {
          procedureCode: createdProcedure.procedureCode,
          level: createdProcedure.level,
        },
      });

      return created(res, toItem(createdProcedure), "Đã tạo thủ tục pháp lý");
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflictError("Mã thủ tục pháp lý đã tồn tại");
      }
      throw error;
    }
  }),
);

legalRouter.patch(
  "/procedures/:id",
  requireRoles(AUTH_ROLES.admin),
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const id = String(req.params.id);
    const actor = (req as AuthenticatedRequest).user;
    const existing = await prisma.legalProcedure.findUnique({ where: { id } });
    if (!existing) throw notFoundError("Không tìm thấy thủ tục pháp lý");

    const item = await prisma.legalProcedure.update({
      where: { id },
      data: {
        ...(parsed.data.sourceDecision !== undefined
          ? { sourceDecision: parsed.data.sourceDecision.trim() }
          : {}),
        ...(parsed.data.legalBasis !== undefined
          ? { legalBasis: parsed.data.legalBasis.trim() }
          : {}),
        ...(parsed.data.level !== undefined
          ? { level: parsed.data.level }
          : {}),
        ...(parsed.data.authorityActors !== undefined
          ? { authorityActors: parsed.data.authorityActors }
          : {}),
        ...(parsed.data.requiresTaxStep !== undefined
          ? { requiresTaxStep: parsed.data.requiresTaxStep }
          : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "LEGAL_PROCEDURE_UPDATED",
      entityType: "LEGAL_PROCEDURE",
      entityId: item.id,
      payload: {
        procedureCode: item.procedureCode,
        previousIsActive: existing.isActive,
        isActive: item.isActive,
      },
    });

    return ok(res, toItem(item), "Đã cập nhật thủ tục pháp lý");
  }),
);
