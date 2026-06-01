import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type { LandCreateInput, LandUpdateInput, LandListInput } from "./land.validation.js";

function toLandItem(item: Record<string, unknown>) {
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
          userId: (item.owner as Record<string, string>).id,
          fullName: (item.owner as Record<string, string>).fullName,
          email: (item.owner as Record<string, string>).email
        }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

type LandParcelWhereInput = Record<string, unknown>;

export async function list(data: LandListInput) {
  const { page, pageSize, keyword, ownerUserId, provinceCode, communeName, landUsePurpose } = data;
  const skip = (page - 1) * pageSize;

  const where: LandParcelWhereInput = {
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(provinceCode ? { provinceCode } : {}),
    ...(communeName ? { communeName: { contains: communeName } } : {}),
    ...(landUsePurpose ? { landUsePurpose: { contains: landUsePurpose } } : {}),
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
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    prisma.landParcel.count({ where })
  ]);

  return { items: items.map((item: Record<string, unknown>) => toLandItem(item)), total };
}

export async function search(query: string, filters: LandListInput) {
  const { page, pageSize, ownerUserId, provinceCode, communeName, landUsePurpose } = filters;
  const where: LandParcelWhereInput = {
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(provinceCode ? { provinceCode } : {}),
    ...(communeName ? { communeName: { contains: communeName } } : {}),
    ...(landUsePurpose ? { landUsePurpose: { contains: landUsePurpose } } : {}),
    ...(query
      ? {
          OR: [
            { parcelCode: { contains: query } },
            { parcelNumber: { contains: query } },
            { mapSheetNumber: { contains: query } },
            { address: { contains: query } }
          ]
        }
      : {})
  };

  const items = await prisma.landParcel.findMany({
    where,
    include: { owner: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  return {
    query: query ?? null,
    items: items.map((item: Record<string, unknown>) => toLandItem(item)),
    total: items.length
  };
}

export async function create(data: LandCreateInput, actor: AuthenticatedRequest["user"]) {
  try {
    const land = await prisma.landParcel.create({
      data: {
        parcelCode: data.parcelCode.toUpperCase(),
        provinceCode: data.provinceCode,
        communeName: data.communeName,
        mapSheetNumber: data.mapSheetNumber,
        parcelNumber: data.parcelNumber,
        area: data.area,
        landUsePurpose: data.landUsePurpose,
        address: data.address,
        ownerUserId: data.ownerUserId ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null
      },
      include: { owner: true }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "LAND_CREATED",
      entityType: "LAND_PARCEL",
      entityId: land.id,
      payload: {
        parcelCode: land.parcelCode,
        provinceCode: land.provinceCode,
        communeName: land.communeName
      }
    });

    return toLandItem(land);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2002") {
      throw conflictError("Duplicate parcel code in the same area");
    }
    if (prismaErr.code === "P2003") {
      throw badRequestError("Owner user is invalid");
    }
    throw error;
  }
}

export async function update(
  id: string,
  data: LandUpdateInput,
  actor: AuthenticatedRequest["user"]
) {
  try {
    const land = await prisma.landParcel.update({
      where: { id },
      data: {
        ...(data.parcelCode !== undefined ? { parcelCode: data.parcelCode.toUpperCase() } : {}),
        ...(data.provinceCode !== undefined ? { provinceCode: data.provinceCode } : {}),
        ...(data.communeName !== undefined ? { communeName: data.communeName } : {}),
        ...(data.mapSheetNumber !== undefined ? { mapSheetNumber: data.mapSheetNumber } : {}),
        ...(data.parcelNumber !== undefined ? { parcelNumber: data.parcelNumber } : {}),
        ...(data.area !== undefined ? { area: data.area } : {}),
        ...(data.landUsePurpose !== undefined ? { landUsePurpose: data.landUsePurpose } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.ownerUserId !== undefined ? { ownerUserId: data.ownerUserId } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {})
      },
      include: { owner: true }
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "LAND_UPDATED",
      entityType: "LAND_PARCEL",
      entityId: land.id,
      payload: {
        parcelCode: land.parcelCode,
        provinceCode: land.provinceCode,
        communeName: land.communeName
      }
    });

    return toLandItem(land);
  } catch (error) {
    const prismaErr = error as { code?: string };
    if (prismaErr.code === "P2025") {
      throw notFoundError("Land parcel not found");
    }
    if (prismaErr.code === "P2002") {
      throw conflictError("Duplicate parcel code in the same area");
    }
    if (prismaErr.code === "P2003") {
      throw badRequestError("Owner user is invalid");
    }
    throw error;
  }
}

export async function getById(id: string) {
  const land = await prisma.landParcel.findUnique({
    where: { id },
    include: { owner: true }
  });
  if (!land) throw notFoundError("Land parcel not found");
  return toLandItem(land);
}
