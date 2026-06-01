import { Router } from "express";
import { Prisma } from "@prisma/client";
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

export const landRouter = Router();

const officerRoles = AUTH_ROLES.officers;

const listSchema = z.object({
  keyword: z.string().optional(),
  ownerUserId: z.string().optional(),
  provinceCode: z.string().optional(),
  communeName: z.string().optional(),
  landUsePurpose: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const createSchema = z.object({
  parcelCode: z.string().min(3),
  provinceCode: z.string().min(1),
  communeName: z.string().min(1),
  mapSheetNumber: z.string().min(1),
  parcelNumber: z.string().min(1),
  area: z.coerce.number().positive(),
  landUsePurpose: z.string().min(1),
  address: z.string().min(3),
  ownerUserId: z.string().nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const updateSchema = createSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    "At least one field must be provided",
  );

function toLandItem(item: {
  id: string;
  parcelCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  area: Prisma.Decimal;
  landUsePurpose: string;
  address: string;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  ownerUserId: string | null;
  owner?: { id: string; fullName: string; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    parcelCode: item.parcelCode,
    provinceCode: item.provinceCode,
    communeName: item.communeName,
    mapSheetNumber: item.mapSheetNumber,
    parcelNumber: item.parcelNumber,
    area: Number(item.area),
    landUsePurpose: item.landUsePurpose,
    address: item.address,
    latitude: item.latitude ? Number(item.latitude) : null,
    longitude: item.longitude ? Number(item.longitude) : null,
    ownerUserId: item.ownerUserId,
    owner: item.owner
      ? {
          userId: item.owner.id,
          fullName: item.owner.fullName,
          email: item.owner.email,
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

landRouter.use(requireAuth, requireRoles(officerRoles));

landRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const {
      page,
      pageSize,
      keyword,
      ownerUserId,
      provinceCode,
      communeName,
      landUsePurpose,
    } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where: Prisma.LandParcelWhereInput = {
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(provinceCode ? { provinceCode } : {}),
      ...(communeName ? { communeName: { contains: communeName } } : {}),
      ...(landUsePurpose
        ? { landUsePurpose: { contains: landUsePurpose } }
        : {}),
      ...(keyword
        ? {
            OR: [
              { parcelCode: { contains: keyword } },
              { parcelNumber: { contains: keyword } },
              { mapSheetNumber: { contains: keyword } },
              { address: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.landParcel.findMany({
        where,
        include: { owner: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.landParcel.count({ where }),
    ]);

    return ok(res, { items: items.map((item) => toLandItem(item)), total });
  }),
);

landRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const keyword = typeof req.query.q === "string" ? req.query.q : undefined;
    const parsed = listSchema.safeParse({
      ...req.query,
      keyword,
      q: undefined,
    });
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const {
      page,
      pageSize,
      ownerUserId,
      provinceCode,
      communeName,
      landUsePurpose,
    } = parsed.data;
    const where: Prisma.LandParcelWhereInput = {
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(provinceCode ? { provinceCode } : {}),
      ...(communeName ? { communeName: { contains: communeName } } : {}),
      ...(landUsePurpose
        ? { landUsePurpose: { contains: landUsePurpose } }
        : {}),
      ...(keyword
        ? {
            OR: [
              { parcelCode: { contains: keyword } },
              { parcelNumber: { contains: keyword } },
              { mapSheetNumber: { contains: keyword } },
              { address: { contains: keyword } },
            ],
          }
        : {}),
    };

    const items = await prisma.landParcel.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return ok(res, {
      query: keyword ?? null,
      items: items.map((item) => toLandItem(item)),
      total: items.length,
    });
  }),
);

landRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const authUser = (req as AuthenticatedRequest).user;

    try {
      const land = await prisma.landParcel.create({
        data: {
          parcelCode: parsed.data.parcelCode.toUpperCase(),
          provinceCode: parsed.data.provinceCode,
          communeName: parsed.data.communeName,
          mapSheetNumber: parsed.data.mapSheetNumber,
          parcelNumber: parsed.data.parcelNumber,
          area: new Prisma.Decimal(parsed.data.area),
          landUsePurpose: parsed.data.landUsePurpose,
          address: parsed.data.address,
          ownerUserId: parsed.data.ownerUserId ?? null,
          latitude:
            parsed.data.latitude !== undefined
              ? new Prisma.Decimal(parsed.data.latitude)
              : null,
          longitude:
            parsed.data.longitude !== undefined
              ? new Prisma.Decimal(parsed.data.longitude)
              : null,
        },
        include: { owner: true },
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: "LAND_CREATED",
        entityType: "LAND_PARCEL",
        entityId: land.id,
        payload: {
          parcelCode: land.parcelCode,
          provinceCode: land.provinceCode,
          communeName: land.communeName,
        },
      });

      return created(res, toLandItem(land));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflictError("Duplicate parcel code in the same area");
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw badRequestError("Owner user is invalid");
      }
      throw error;
    }
  }),
);

landRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const authUser = (req as AuthenticatedRequest).user;

    try {
      const land = await prisma.landParcel.update({
        where: { id: String(req.params.id) },
        data: {
          ...(parsed.data.parcelCode !== undefined
            ? { parcelCode: parsed.data.parcelCode.toUpperCase() }
            : {}),
          ...(parsed.data.provinceCode !== undefined
            ? { provinceCode: parsed.data.provinceCode }
            : {}),
          ...(parsed.data.communeName !== undefined
            ? { communeName: parsed.data.communeName }
            : {}),
          ...(parsed.data.mapSheetNumber !== undefined
            ? { mapSheetNumber: parsed.data.mapSheetNumber }
            : {}),
          ...(parsed.data.parcelNumber !== undefined
            ? { parcelNumber: parsed.data.parcelNumber }
            : {}),
          ...(parsed.data.area !== undefined
            ? { area: new Prisma.Decimal(parsed.data.area) }
            : {}),
          ...(parsed.data.landUsePurpose !== undefined
            ? { landUsePurpose: parsed.data.landUsePurpose }
            : {}),
          ...(parsed.data.address !== undefined
            ? { address: parsed.data.address }
            : {}),
          ...(parsed.data.ownerUserId !== undefined
            ? { ownerUserId: parsed.data.ownerUserId }
            : {}),
          ...(parsed.data.latitude !== undefined
            ? { latitude: new Prisma.Decimal(parsed.data.latitude) }
            : {}),
          ...(parsed.data.longitude !== undefined
            ? { longitude: new Prisma.Decimal(parsed.data.longitude) }
            : {}),
        },
        include: { owner: true },
      });

      await writeAuditLog({
        actorId: authUser.userId,
        action: "LAND_UPDATED",
        entityType: "LAND_PARCEL",
        entityId: land.id,
        payload: {
          parcelCode: land.parcelCode,
          provinceCode: land.provinceCode,
          communeName: land.communeName,
        },
      });

      return ok(res, toLandItem(land));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw notFoundError("Land parcel not found");
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflictError("Duplicate parcel code in the same area");
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw badRequestError("Owner user is invalid");
      }
      throw error;
    }
  }),
);

landRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const land = await prisma.landParcel.findUnique({
      where: { id: String(req.params.id) },
      include: { owner: true },
    });
    if (!land) throw notFoundError("Land parcel not found");
    return ok(res, toLandItem(land));
  }),
);
