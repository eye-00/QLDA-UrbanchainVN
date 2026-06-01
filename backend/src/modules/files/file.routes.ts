import { Router } from "express";
import multer from "multer";
import { readFile, unlink } from "node:fs/promises";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import {
  asyncHandler,
  badRequestError,
  forbiddenError,
  notFoundError,
} from "../../lib/errors.js";
import { uploadToIpfs } from "../../lib/ipfs.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { demoStore } from "../../lib/store/demo-store.js";
import {
  AUTH_ROLES,
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from "../auth/auth.middleware.js";

const upload = multer({ dest: "tmp/uploads" });
export const fileRouter = Router();

const uploadSchema = z.object({
  documentType: z.string().min(1).default("UNKNOWN"),
  ownerType: z.string().min(1).default("USER"),
  ownerId: z.string().optional(),
  registrationId: z.string().optional(),
});

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(
    role as (typeof AUTH_ROLES.citizen)[number],
  );
}

function canAccessDemoFile(fileId: string, user: AuthenticatedRequest["user"]) {
  if (!isCitizenRole(user.role)) return true;

  const hasRegistrationFile = demoStore
    .listRegistrations()
    .some(
      (registration) =>
        registration.applicantId === user.userId &&
        registration.fileIds.some((file) => file.id === fileId),
    );

  if (hasRegistrationFile) return true;

  return demoStore
    .listTransfers()
    .some(
      (transfer) =>
        transfer.fromUserId === user.userId &&
        transfer.supportingFileIds.includes(fileId),
    );
}

async function canAccessPrismaFile(
  file: { ownerId: string; registration: { applicantId: string } | null },
  user: AuthenticatedRequest["user"],
) {
  if (!isCitizenRole(user.role)) return true;
  if (file.ownerId === user.userId) return true;
  if (file.registration?.applicantId === user.userId) return true;
  return false;
}

fileRouter.post(
  "/upload",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    if (!req.file) throw badRequestError("Thiếu tệp đính kèm");

    const user = (req as AuthenticatedRequest).user;
    const originalName =
      req.file?.originalname ?? req.body.originalName ?? "document.bin";
    let ipfsUpload: Awaited<ReturnType<typeof uploadToIpfs>>;

    try {
      const buffer = await readFile(req.file.path);
      ipfsUpload = await uploadToIpfs({
        buffer,
        fileName: originalName,
        contentType: req.file.mimetype,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Upload thất bại";
      throw badRequestError(`Không tải được tệp lên IPFS: ${reason}`);
    } finally {
      await unlink(req.file.path).catch(() => undefined);
    }

    if (parsed.data.registrationId) {
      const registration = await prisma.registration.findUnique({
        where: { id: parsed.data.registrationId },
      });
      if (!registration)
        throw notFoundError("Không tìm thấy hồ sơ đăng ký để gắn tệp");
    }

    const createdFile = await prisma.fileAsset.create({
      data: {
        ownerType: parsed.data.ownerType,
        ownerId: parsed.data.ownerId ?? user.userId,
        documentType: parsed.data.documentType,
        originalName,
        storageStatus: "UPLOADED_IPFS",
        cid: ipfsUpload.cid,
        hash: ipfsUpload.hash,
        registrationId: parsed.data.registrationId,
      },
    });

    if (createdFile.registrationId) {
      const aggregate = await prisma.registrationDocumentVersion.aggregate({
        where: { registrationId: createdFile.registrationId },
        _max: { versionNumber: true },
      });
      const nextVersionNumber = (aggregate._max.versionNumber ?? 0) + 1;

      await prisma.registrationDocumentVersion.updateMany({
        where: {
          registrationId: createdFile.registrationId,
          documentType: createdFile.documentType,
          status: "ACTIVE",
        },
        data: {
          status: "REPLACED",
          updatedAt: new Date(),
        },
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
          createdById: user.userId,
        },
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
        registrationId: createdFile.registrationId ?? null,
      },
    });

    return created(
      res,
      {
        id: createdFile.id,
        originalName: createdFile.originalName,
        documentType: createdFile.documentType,
        storageStatus: createdFile.storageStatus,
        cid: createdFile.cid,
        hash: createdFile.hash,
        provider: ipfsUpload.provider,
      },
      "Đã tải tệp và lưu metadata IPFS thành công",
    );
  }),
);

fileRouter.get(
  "/:fileId",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const fileId = String(req.params.fileId);
    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: { registration: { select: { applicantId: true } } },
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user)))
        throw forbiddenError("Bạn không có quyền xem file này");

      return ok(res, {
        id: file.id,
        originalName: file.originalName,
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        cid: file.cid,
        hash: file.hash,
        createdAt: file.createdAt,
      });
    }

    const demoFile = demoStore.getFile(fileId);
    if (!demoFile) throw notFoundError("Không tìm thấy file");
    if (!canAccessDemoFile(fileId, user))
      throw forbiddenError("Bạn không có quyền xem file này");
    return ok(res, demoFile);
  }),
);

fileRouter.get(
  "/:fileId/download",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const fileId = String(req.params.fileId);
    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: { registration: { select: { applicantId: true } } },
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user)))
        throw forbiddenError("Bạn không có quyền tải file này");

      return ok(res, {
        fileId: file.id,
        cid: file.cid,
        downloadUrl: file.cid ? `http://localhost:8081/ipfs/${file.cid}` : null,
      });
    }

    const demoFile = demoStore.getFile(fileId);
    if (!demoFile) throw notFoundError("Không tìm thấy file");
    if (!canAccessDemoFile(fileId, user))
      throw forbiddenError("Bạn không có quyền tải file này");

    return ok(res, {
      fileId: demoFile.id,
      cid: demoFile.cid,
      downloadUrl: demoFile.cid
        ? `http://localhost:8081/ipfs/${demoFile.cid}`
        : null,
    });
  }),
);

fileRouter.get(
  "/:fileId/integrity",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const fileId = String(req.params.fileId);
    const file = await prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: { registration: { select: { applicantId: true } } },
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user)))
        throw forbiddenError("Bạn không có quyền kiểm tra tệp này");

      const checks = {
        hasCid: Boolean(file.cid),
        hasHash: Boolean(file.hash),
        storageStatusValid: file.storageStatus === "UPLOADED_IPFS",
      };
      const isValid =
        checks.hasCid && checks.hasHash && checks.storageStatusValid;

      await writeAuditLog({
        actorId: user.userId,
        action: "FILE_INTEGRITY_CHECKED",
        entityType: "FILE",
        entityId: file.id,
        payload: { isValid, checks },
      });

      return ok(
        res,
        {
          fileId: file.id,
          cid: file.cid,
          hash: file.hash,
          storageStatus: file.storageStatus,
          checks,
          isValid,
        },
        isValid
          ? "Kiểm tra toàn vẹn tệp thành công"
          : "Phát hiện rủi ro toàn vẹn tệp",
      );
    }

    const demoFile = demoStore.getFile(fileId);
    if (!demoFile) throw notFoundError("Không tìm thấy file");
    if (!canAccessDemoFile(fileId, user))
      throw forbiddenError("Bạn không có quyền kiểm tra tệp này");

    const checks = {
      hasCid: Boolean(demoFile.cid),
      hasHash: Boolean(demoFile.hash),
      storageStatusValid: demoFile.storageStatus === "UPLOADED_IPFS",
    };
    const isValid =
      checks.hasCid && checks.hasHash && checks.storageStatusValid;

    return ok(
      res,
      {
        fileId: demoFile.id,
        cid: demoFile.cid,
        hash: demoFile.hash,
        storageStatus: demoFile.storageStatus,
        checks,
        isValid,
      },
      isValid
        ? "Kiểm tra toàn vẹn tệp thành công"
        : "Phát hiện rủi ro toàn vẹn tệp",
    );
  }),
);
