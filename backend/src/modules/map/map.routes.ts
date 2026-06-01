import { LandSourceType, ParcelGeometryStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import {
  asyncHandler,
  badRequestError,
  conflictError,
  notFoundError,
} from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import {
  AUTH_ROLES,
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from "../auth/auth.middleware.js";

const sourceTypeSchema = z.enum([
  "DEMO",
  "IMPORTED",
  "OFFICIAL_REFERENCE",
  "UNKNOWN_NEEDS_REVIEW",
]);
const geometryStatusSchema = z.enum([
  "DRAFT",
  "UNDER_REVIEW",
  "OFFCHAIN_APPROVED",
  "BOUNDARY_HASH_RECORDED",
]);

const listSchema = z.object({
  keyword: z.string().optional(),
  sourceType: sourceTypeSchema.optional(),
  geometryStatus: geometryStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const upsertGeometrySchema = z.object({
  sourceType: sourceTypeSchema.optional(),
  geometry: z.record(z.any()),
  note: z.string().min(3).optional(),
});

const reviewGeometrySchema = z.object({
  decision: z.enum(["REVIEWED", "NEEDS_UPDATE"]).default("REVIEWED"),
  note: z.string().min(3),
  sourceType: sourceTypeSchema.optional(),
});

const approveOffchainSchema = z.object({
  note: z.string().min(3).optional(),
});

const recordBoundaryHashSchema = z.object({
  boundaryHashValue: z.string().min(8),
  boundaryHashTxHash: z.string().min(8).optional(),
  boundaryHashCid: z.string().min(3).optional(),
  note: z.string().min(3).optional(),
});

function toMapParcelItem(item: {
  id: string;
  parcelCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  area: Prisma.Decimal;
  address: string;
  sourceType: LandSourceType;
  geometryStatus: ParcelGeometryStatus;
  geometry: Prisma.JsonValue | null;
  geometryReviewedAt: Date | null;
  geometryReviewedById: string | null;
  geometryOffchainApprovedAt: Date | null;
  geometryApprovedById: string | null;
  boundaryHashRecordedAt: Date | null;
  boundaryHashRecordedById: string | null;
  boundaryHashTxHash: string | null;
  boundaryHashCid: string | null;
  boundaryHashValue: string | null;
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
    address: item.address,
    sourceType: item.sourceType,
    geometryStatus: item.geometryStatus,
    geometry: item.geometry,
    geometryReviewedAt: item.geometryReviewedAt,
    geometryReviewedById: item.geometryReviewedById,
    geometryOffchainApprovedAt: item.geometryOffchainApprovedAt,
    geometryApprovedById: item.geometryApprovedById,
    boundaryHashRecordedAt: item.boundaryHashRecordedAt,
    boundaryHashRecordedById: item.boundaryHashRecordedById,
    boundaryHashTxHash: item.boundaryHashTxHash,
    boundaryHashCid: item.boundaryHashCid,
    boundaryHashValue: item.boundaryHashValue,
    updatedAt: item.updatedAt,
  };
}

async function findLandOrThrow(landRecordId: string) {
  const land = await prisma.landParcel.findUnique({
    where: { id: landRecordId },
  });
  if (!land) throw notFoundError("Không tìm thấy thửa đất");
  return land;
}

export const mapRouter = Router();
mapRouter.use(requireAuth);

mapRouter.get(
  "/parcels",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const { page, pageSize, keyword, sourceType, geometryStatus } = parsed.data;
    const skip = (page - 1) * pageSize;
    const where: Prisma.LandParcelWhereInput = {
      ...(sourceType ? { sourceType } : {}),
      ...(geometryStatus ? { geometryStatus } : {}),
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
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.landParcel.count({ where }),
    ]);
    return ok(res, {
      items: items.map((item) => toMapParcelItem(item)),
      total,
      page,
      pageSize,
    });
  }),
);

mapRouter.get(
  "/parcels/:landRecordId",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  asyncHandler(async (req, res) => {
    const land = await findLandOrThrow(String(req.params.landRecordId));
    return ok(res, toMapParcelItem(land));
  }),
);

mapRouter.post(
  "/parcels/:landRecordId/geometry",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = upsertGeometrySchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const land = await findLandOrThrow(String(req.params.landRecordId));

    if (land.geometryStatus === "BOUNDARY_HASH_RECORDED") {
      throw conflictError(
        "Không thể cập nhật geometry sau khi đã ghi boundary hash",
      );
    }

    const updated = await prisma.landParcel.update({
      where: { id: land.id },
      data: {
        sourceType: parsed.data.sourceType ?? land.sourceType,
        geometry: parsed.data.geometry,
        geometryStatus: "DRAFT",
        geometryReviewedAt: null,
        geometryReviewedById: null,
        geometryOffchainApprovedAt: null,
        geometryApprovedById: null,
        boundaryHashRecordedAt: null,
        boundaryHashRecordedById: null,
        boundaryHashTxHash: null,
        boundaryHashCid: null,
        boundaryHashValue: null,
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "MAP_GEOMETRY_UPSERTED",
      entityType: "LAND_PARCEL",
      entityId: updated.id,
      payload: {
        sourceType: updated.sourceType,
        geometryStatus: updated.geometryStatus,
        note: parsed.data.note ?? null,
      },
    });

    return ok(res, toMapParcelItem(updated), "Đã cập nhật dữ liệu geometry");
  }),
);

mapRouter.post(
  "/parcels/:landRecordId/review",
  requireRoles(["COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = reviewGeometrySchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const land = await findLandOrThrow(String(req.params.landRecordId));

    if (!land.geometry)
      throw badRequestError("Thửa đất chưa có geometry để review");
    if (land.geometryStatus === "BOUNDARY_HASH_RECORDED") {
      throw conflictError(
        "Không thể review geometry sau khi đã ghi boundary hash",
      );
    }

    const nextStatus: ParcelGeometryStatus =
      parsed.data.decision === "NEEDS_UPDATE" ? "DRAFT" : "UNDER_REVIEW";
    const updated = await prisma.landParcel.update({
      where: { id: land.id },
      data: {
        sourceType: parsed.data.sourceType ?? land.sourceType,
        geometryStatus: nextStatus,
        geometryReviewedAt: new Date(),
        geometryReviewedById: actor.userId,
        ...(nextStatus === "DRAFT"
          ? {
              geometryApprovedById: null,
              geometryOffchainApprovedAt: null,
              boundaryHashRecordedById: null,
              boundaryHashRecordedAt: null,
              boundaryHashTxHash: null,
              boundaryHashCid: null,
              boundaryHashValue: null,
            }
          : {}),
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "MAP_GEOMETRY_REVIEWED",
      entityType: "LAND_PARCEL",
      entityId: updated.id,
      payload: {
        decision: parsed.data.decision,
        geometryStatus: updated.geometryStatus,
        note: parsed.data.note,
      },
    });

    return ok(res, toMapParcelItem(updated), "Đã review dữ liệu geometry");
  }),
);

mapRouter.post(
  "/parcels/:landRecordId/approve-offchain",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = approveOffchainSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const land = await findLandOrThrow(String(req.params.landRecordId));

    if (!land.geometry)
      throw badRequestError("Thửa đất chưa có geometry để phê duyệt");
    if (land.geometryStatus !== "UNDER_REVIEW") {
      throw conflictError(
        `Không thể phê duyệt off-chain khi trạng thái geometry hiện tại là ${land.geometryStatus}`,
      );
    }

    const updated = await prisma.landParcel.update({
      where: { id: land.id },
      data: {
        geometryStatus: "OFFCHAIN_APPROVED",
        geometryApprovedById: actor.userId,
        geometryOffchainApprovedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "MAP_GEOMETRY_OFFCHAIN_APPROVED",
      entityType: "LAND_PARCEL",
      entityId: updated.id,
      payload: {
        geometryStatus: updated.geometryStatus,
        note: parsed.data.note ?? null,
      },
    });

    return ok(
      res,
      toMapParcelItem(updated),
      "Đã phê duyệt off-chain dữ liệu geometry",
    );
  }),
);

mapRouter.post(
  "/parcels/:landRecordId/record-boundary-hash",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = recordBoundaryHashSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const land = await findLandOrThrow(String(req.params.landRecordId));

    if (land.geometryStatus !== "OFFCHAIN_APPROVED") {
      throw conflictError(
        `Không thể ghi boundary hash khi trạng thái geometry hiện tại là ${land.geometryStatus}`,
      );
    }

    const updated = await prisma.landParcel.update({
      where: { id: land.id },
      data: {
        geometryStatus: "BOUNDARY_HASH_RECORDED",
        boundaryHashRecordedById: actor.userId,
        boundaryHashRecordedAt: new Date(),
        boundaryHashTxHash: parsed.data.boundaryHashTxHash ?? null,
        boundaryHashCid: parsed.data.boundaryHashCid ?? null,
        boundaryHashValue: parsed.data.boundaryHashValue,
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "MAP_BOUNDARY_HASH_RECORDED",
      entityType: "LAND_PARCEL",
      entityId: updated.id,
      payload: {
        boundaryHashValue: parsed.data.boundaryHashValue,
        boundaryHashTxHash: parsed.data.boundaryHashTxHash ?? null,
        boundaryHashCid: parsed.data.boundaryHashCid ?? null,
        note: parsed.data.note ?? null,
      },
    });

    return ok(
      res,
      toMapParcelItem(updated),
      "Đã ghi nhận boundary hash cho thửa đất",
    );
  }),
);

mapRouter.get(
  "/layers",
  requireRoles([...AUTH_ROLES.officers, ...AUTH_ROLES.citizen]),
  asyncHandler(async (_req, res) => {
    return ok(res, {
      items: [
        {
          key: "parcel-base",
          name: "Lớp thửa đất",
          sourceType: "DEMO",
          warning: "Dữ liệu demo chỉ phục vụ mô phỏng nghiệp vụ.",
        },
        {
          key: "official-reference",
          name: "Lớp tham chiếu chính thức",
          sourceType: "OFFICIAL_REFERENCE",
          warning: null,
        },
        {
          key: "review-overlay",
          name: "Lớp rà soát pháp lý",
          sourceType: "UNKNOWN_NEEDS_REVIEW",
          warning:
            "Cần rà soát lại nguồn dữ liệu trước khi dùng cho quyết định nghiệp vụ.",
        },
      ],
    });
  }),
);
