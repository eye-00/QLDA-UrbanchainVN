import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type {
  MapListInput,
  GeometryUpsertInput,
  GeometryReviewInput,
  ApproveInput,
  RecordBoundaryHashInput
} from "./map.validation.js";

function toMapParcelItem(item: Record<string, unknown>) {
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
    updatedAt: item.updatedAt
  };
}

async function findLandOrThrow(landRecordId: string) {
  const land = await prisma.landParcel.findUnique({
    where: { id: landRecordId }
  });
  if (!land) throw notFoundError("Không tìm thấy thửa đất");
  return land;
}

type LandParcelWhereInput = {
  sourceType?: unknown;
  geometryStatus?: unknown;
  OR?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export async function list(data: MapListInput) {
  const { page, pageSize, keyword, sourceType, geometryStatus } = data;
  const skip = (page - 1) * pageSize;
  const where: LandParcelWhereInput = {
    ...(sourceType ? { sourceType } : {}),
    ...(geometryStatus ? { geometryStatus } : {}),
    ...(keyword
      ? {
          OR: [
            { parcelCode: { contains: keyword } },
            { parcelNumber: { contains: keyword } },
            { mapSheetNumber: { contains: keyword } },
            { address: { contains: keyword } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.landParcel.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize
    }),
    prisma.landParcel.count({ where })
  ]);
  return {
    items: items.map((item: Record<string, unknown>) => toMapParcelItem(item)),
    total,
    page,
    pageSize
  };
}

export async function getById(landRecordId: string) {
  const land = await findLandOrThrow(landRecordId);
  return toMapParcelItem(land);
}

export async function upsertGeometry(
  landRecordId: string,
  data: GeometryUpsertInput,
  actor: AuthenticatedRequest["user"]
) {
  const land = await findLandOrThrow(landRecordId);

  if (land.geometryStatus === "BOUNDARY_HASH_RECORDED") {
    throw conflictError("Không thể cập nhật geometry sau khi đã ghi boundary hash");
  }

  const updated = await prisma.landParcel.update({
    where: { id: land.id },
    data: {
      sourceType: data.sourceType ?? land.sourceType,
      geometry: data.geometry,
      geometryStatus: "DRAFT",
      geometryReviewedAt: null,
      geometryReviewedById: null,
      geometryOffchainApprovedAt: null,
      geometryApprovedById: null,
      boundaryHashRecordedAt: null,
      boundaryHashRecordedById: null,
      boundaryHashTxHash: null,
      boundaryHashCid: null,
      boundaryHashValue: null
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "MAP_GEOMETRY_UPSERTED",
    entityType: "LAND_PARCEL",
    entityId: updated.id,
    payload: {
      sourceType: updated.sourceType,
      geometryStatus: updated.geometryStatus,
      note: data.note ?? null
    }
  });

  return toMapParcelItem(updated);
}

export async function reviewGeometry(
  landRecordId: string,
  data: GeometryReviewInput,
  actor: AuthenticatedRequest["user"]
) {
  const land = await findLandOrThrow(landRecordId);

  if (!land.geometry) throw badRequestError("Thửa đất chưa có geometry để review");
  if (land.geometryStatus === "BOUNDARY_HASH_RECORDED") {
    throw conflictError("Không thể review geometry sau khi đã ghi boundary hash");
  }

  const nextStatus = data.decision === "NEEDS_UPDATE" ? "DRAFT" : "UNDER_REVIEW";
  const updated = await prisma.landParcel.update({
    where: { id: land.id },
    data: {
      sourceType: data.sourceType ?? land.sourceType,
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
            boundaryHashValue: null
          }
        : {})
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "MAP_GEOMETRY_REVIEWED",
    entityType: "LAND_PARCEL",
    entityId: updated.id,
    payload: {
      decision: data.decision,
      geometryStatus: updated.geometryStatus,
      note: data.note
    }
  });

  return toMapParcelItem(updated);
}

export async function approve(
  landRecordId: string,
  data: ApproveInput,
  actor: AuthenticatedRequest["user"]
) {
  const land = await findLandOrThrow(landRecordId);

  if (!land.geometry) throw badRequestError("Thửa đất chưa có geometry để phê duyệt");
  if (land.geometryStatus !== "UNDER_REVIEW") {
    throw conflictError(
      `Không thể phê duyệt off-chain khi trạng thái geometry hiện tại là ${land.geometryStatus}`
    );
  }

  const updated = await prisma.landParcel.update({
    where: { id: land.id },
    data: {
      geometryStatus: "OFFCHAIN_APPROVED",
      geometryApprovedById: actor.userId,
      geometryOffchainApprovedAt: new Date()
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "MAP_GEOMETRY_OFFCHAIN_APPROVED",
    entityType: "LAND_PARCEL",
    entityId: updated.id,
    payload: {
      geometryStatus: updated.geometryStatus,
      note: data.note ?? null
    }
  });

  return toMapParcelItem(updated);
}

export async function recordBoundaryHash(
  landRecordId: string,
  data: RecordBoundaryHashInput,
  actor: AuthenticatedRequest["user"]
) {
  const land = await findLandOrThrow(landRecordId);

  if (land.geometryStatus !== "OFFCHAIN_APPROVED") {
    throw conflictError(
      `Không thể ghi boundary hash khi trạng thái geometry hiện tại là ${land.geometryStatus}`
    );
  }

  const updated = await prisma.landParcel.update({
    where: { id: land.id },
    data: {
      geometryStatus: "BOUNDARY_HASH_RECORDED",
      boundaryHashRecordedById: actor.userId,
      boundaryHashRecordedAt: new Date(),
      boundaryHashTxHash: data.boundaryHashTxHash ?? null,
      boundaryHashCid: data.boundaryHashCid ?? null,
      boundaryHashValue: data.boundaryHashValue
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "MAP_BOUNDARY_HASH_RECORDED",
    entityType: "LAND_PARCEL",
    entityId: updated.id,
    payload: {
      boundaryHashValue: data.boundaryHashValue,
      boundaryHashTxHash: data.boundaryHashTxHash ?? null,
      boundaryHashCid: data.boundaryHashCid ?? null,
      note: data.note ?? null
    }
  });

  return toMapParcelItem(updated);
}

export async function getLayers() {
  return {
    items: [
      {
        key: "parcel-base",
        name: "Lớp thửa đất",
        sourceType: "DEMO",
        warning: "Dữ liệu demo chỉ phục vụ mô phỏng nghiệp vụ."
      },
      {
        key: "official-reference",
        name: "Lớp tham chiếu chính thức",
        sourceType: "OFFICIAL_REFERENCE",
        warning: null
      },
      {
        key: "review-overlay",
        name: "Lớp rà soát pháp lý",
        sourceType: "UNKNOWN_NEEDS_REVIEW",
        warning: "Cần rà soát lại nguồn dữ liệu trước khi dùng cho quyết định nghiệp vụ."
      }
    ]
  };
}
