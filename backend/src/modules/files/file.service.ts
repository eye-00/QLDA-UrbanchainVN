import { readFile, unlink } from "node:fs/promises";
import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { uploadToIpfs } from "../../lib/ipfs.js";
import { prisma } from "../../lib/prisma.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES } from "../auth/auth.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type { UploadFileInput } from "./file.validation.js";

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function canAccessDemoFile(fileId: string, user: AuthenticatedRequest["user"]) {
  if (!isCitizenRole(user.role)) return true;

  const hasRegistrationFile = demoStore
    .listRegistrations()
    .some(
      (registration) =>
        registration.applicantId === user.userId &&
        registration.fileIds.some((file) => file.id === fileId)
    );

  if (hasRegistrationFile) return true;

  return demoStore
    .listTransfers()
    .some(
      (transfer) =>
        transfer.fromUserId === user.userId && transfer.supportingFileIds.includes(fileId)
    );
}

async function canAccessPrismaFile(
  file: { ownerId: string; registration: { applicantId: string } | null },
  user: AuthenticatedRequest["user"]
) {
  if (!isCitizenRole(user.role)) return true;
  if (file.ownerId === user.userId) return true;
  if (file.registration?.applicantId === user.userId) return true;
  return false;
}

export async function upload(
  data: UploadFileInput,
  file: Express.Multer.File | undefined,
  user: AuthenticatedRequest["user"]
) {
  if (!file) throw badRequestError("Thiếu tệp đính kèm");

  const originalName = file?.originalname ?? data.originalName ?? "document.bin";
  let ipfsUpload: Awaited<ReturnType<typeof uploadToIpfs>>;

  try {
    const buffer = await readFile(file.path);
    ipfsUpload = await uploadToIpfs({
      buffer,
      fileName: originalName,
      contentType: file.mimetype
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Upload thất bại";
    throw badRequestError(`Không tải được tệp lên IPFS: ${reason}`);
  } finally {
    await unlink(file.path).catch(() => undefined);
  }

  if (data.registrationId) {
    const registration = await prisma.registration.findUnique({
      where: { id: data.registrationId }
    });
    if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký để gắn tệp");
  }

  const createdFile = await prisma.fileAsset.create({
    data: {
      ownerType: data.ownerType,
      ownerId: data.ownerId ?? user.userId,
      documentType: data.documentType,
      originalName,
      storageStatus: "UPLOADED_IPFS",
      cid: ipfsUpload.cid,
      hash: ipfsUpload.hash,
      registrationId: data.registrationId
    }
  });

  if (createdFile.registrationId) {
    const aggregate = await prisma.registrationDocumentVersion.aggregate({
      where: { registrationId: createdFile.registrationId },
      _max: { versionNumber: true }
    });
    const nextVersionNumber = (aggregate._max.versionNumber ?? 0) + 1;

    await prisma.registrationDocumentVersion.updateMany({
      where: {
        registrationId: createdFile.registrationId,
        documentType: createdFile.documentType,
        status: "ACTIVE"
      },
      data: {
        status: "REPLACED",
        updatedAt: new Date()
      }
    });

    await prisma.registrationDocumentVersion.create({
      data: {
        registrationId: createdFile.registrationId,
        versionNumber: nextVersionNumber,
        documentType: createdFile.documentType,
        storageStatus: createdFile.storageStatus,
        cid: createdFile.cid,
        hash: createdFile.hash,
        status: "ACTIVE",
        note: "Tạo version tự động từ API upload file",
        fileAssetId: createdFile.id,
        createdById: user.userId
      }
    });
  }

  await writeAuditLog({
    actorId: user.userId,
    action: "FILE_UPLOADED",
    entityType: "FILE",
    entityId: createdFile.id,
    payload: {
      documentType: createdFile.documentType,
      storageStatus: createdFile.storageStatus,
      registrationId: createdFile.registrationId ?? null
    }
  });

  return {
    id: createdFile.id,
    originalName: createdFile.originalName,
    documentType: createdFile.documentType,
    storageStatus: createdFile.storageStatus,
    cid: createdFile.cid,
    hash: createdFile.hash,
    provider: ipfsUpload.provider
  };
}

export async function getDetail(fileId: string, user: AuthenticatedRequest["user"]) {
  const dbFile = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    include: { registration: { select: { applicantId: true } } }
  });

  if (dbFile) {
    if (!(await canAccessPrismaFile(dbFile, user)))
      throw forbiddenError("Bạn không có quyền xem file này");

    return {
      id: dbFile.id,
      originalName: dbFile.originalName,
      documentType: dbFile.documentType,
      storageStatus: dbFile.storageStatus,
      cid: dbFile.cid,
      hash: dbFile.hash,
      createdAt: dbFile.createdAt
    };
  }

  const demoFile = demoStore.getFile(fileId);
  if (!demoFile) throw notFoundError("Không tìm thấy file");
  if (!canAccessDemoFile(fileId, user)) throw forbiddenError("Bạn không có quyền xem file này");
  return demoFile;
}

export async function downloadUrl(fileId: string, user: AuthenticatedRequest["user"]) {
  const dbFile = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    include: { registration: { select: { applicantId: true } } }
  });

  if (dbFile) {
    if (!(await canAccessPrismaFile(dbFile, user)))
      throw forbiddenError("Bạn không có quyền tải file này");

    return {
      fileId: dbFile.id,
      cid: dbFile.cid,
      downloadUrl: dbFile.cid ? `http://localhost:8081/ipfs/${dbFile.cid}` : null
    };
  }

  const demoFile = demoStore.getFile(fileId);
  if (!demoFile) throw notFoundError("Không tìm thấy file");
  if (!canAccessDemoFile(fileId, user)) throw forbiddenError("Bạn không có quyền tải file này");

  return {
    fileId: demoFile.id,
    cid: demoFile.cid,
    downloadUrl: demoFile.cid ? `http://localhost:8081/ipfs/${demoFile.cid}` : null
  };
}

export async function integrityCheck(fileId: string, user: AuthenticatedRequest["user"]) {
  const dbFile = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    include: { registration: { select: { applicantId: true } } }
  });

  if (dbFile) {
    if (!(await canAccessPrismaFile(dbFile, user)))
      throw forbiddenError("Bạn không có quyền kiểm tra tệp này");

    const checks = {
      hasCid: Boolean(dbFile.cid),
      hasHash: Boolean(dbFile.hash),
      storageStatusValid: dbFile.storageStatus === "UPLOADED_IPFS"
    };
    const isValid = checks.hasCid && checks.hasHash && checks.storageStatusValid;

    await writeAuditLog({
      actorId: user.userId,
      action: "FILE_INTEGRITY_CHECKED",
      entityType: "FILE",
      entityId: dbFile.id,
      payload: { isValid, checks }
    });

    return {
      fileId: dbFile.id,
      cid: dbFile.cid,
      hash: dbFile.hash,
      storageStatus: dbFile.storageStatus,
      checks,
      isValid
    };
  }

  const demoFile = demoStore.getFile(fileId);
  if (!demoFile) throw notFoundError("Không tìm thấy file");
  if (!canAccessDemoFile(fileId, user)) throw forbiddenError("Bạn không có quyền kiểm tra tệp này");

  const checks = {
    hasCid: Boolean(demoFile.cid),
    hasHash: Boolean(demoFile.hash),
    storageStatusValid: demoFile.storageStatus === "UPLOADED_IPFS"
  };
  const isValid = checks.hasCid && checks.hasHash && checks.storageStatusValid;

  return {
    fileId: demoFile.id,
    cid: demoFile.cid,
    hash: demoFile.hash,
    storageStatus: demoFile.storageStatus,
    checks,
    isValid
  };
}

export async function list() {
  return [];
}

export async function deleteFile() {
  return { deleted: false };
}
