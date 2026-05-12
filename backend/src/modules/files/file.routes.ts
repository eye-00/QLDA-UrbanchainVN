import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { uploadToIpfs } from "../../lib/ipfs.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });
export const fileRouter = Router();

const uploadSchema = z.object({
  documentType: z.string().min(1).default("UNKNOWN"),
  ownerType: z.string().min(1).default("USER"),
  ownerId: z.string().optional(),
  registrationId: z.string().optional()
});

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function canAccessDemoFile(fileId: string, user: AuthenticatedRequest["user"]) {
  if (!isCitizenRole(user.role)) return true;

  const hasRegistrationFile = demoStore
    .listRegistrations()
    .some((registration) => registration.applicantId === user.userId && registration.fileIds.some((file) => file.id === fileId));

  if (hasRegistrationFile) return true;

  return demoStore
    .listTransfers()
    .some((transfer) => transfer.fromUserId === user.userId && transfer.supportingFileIds.includes(fileId));
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

fileRouter.post(
  "/upload",
  requireAuth,
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    if (!req.file?.buffer) throw badRequestError("Thiếu tệp tải lên");

    const originalName = req.file.originalname ?? req.body.originalName ?? "document.bin";
    const uploadResult = await uploadToIpfs({
      buffer: req.file.buffer,
      fileName: originalName,
      contentType: req.file.mimetype
    });

    if (parsed.data.registrationId) {
      const registration = await prisma.registration.findUnique({ where: { id: parsed.data.registrationId } });
      if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký để gắn tệp");
    }

    const createdFile = await prisma.fileAsset.create({
      data: {
        ownerType: parsed.data.ownerType,
        ownerId: parsed.data.ownerId ?? user.userId,
        documentType: parsed.data.documentType,
        originalName,
        storageStatus: "UPLOADED_IPFS",
        cid: uploadResult.cid,
        hash: uploadResult.hash,
        registrationId: parsed.data.registrationId
      }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "FILE_UPLOADED",
      entityType: "FILE",
      entityId: createdFile.id,
      payload: {
        documentType: createdFile.documentType,
        storageStatus: createdFile.storageStatus,
        registrationId: createdFile.registrationId ?? null,
        provider: uploadResult.provider
      }
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
        provider: uploadResult.provider
      },
      "Đã tải tệp và lưu metadata IPFS thành công"
    );
  })
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
      include: { registration: { select: { applicantId: true } } }
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user))) throw forbiddenError("Bạn không có quyền xem file này");

      return ok(res, {
        id: file.id,
        originalName: file.originalName,
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        cid: file.cid,
        hash: file.hash,
        createdAt: file.createdAt
      });
    }

    const demoFile = demoStore.getFile(fileId);
    if (!demoFile) throw notFoundError("Không tìm thấy file");
    if (!canAccessDemoFile(fileId, user)) throw forbiddenError("Bạn không có quyền xem file này");
    return ok(res, demoFile);
  })
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
      include: { registration: { select: { applicantId: true } } }
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user))) throw forbiddenError("Bạn không có quyền tải file này");

      return ok(res, {
        fileId: file.id,
        cid: file.cid,
        downloadUrl: file.cid ? `http://localhost:8081/ipfs/${file.cid}` : null
      });
    }

    const demoFile = demoStore.getFile(fileId);
    if (!demoFile) throw notFoundError("Không tìm thấy file");
    if (!canAccessDemoFile(fileId, user)) throw forbiddenError("Bạn không có quyền tải file này");

    return ok(res, {
      fileId: demoFile.id,
      cid: demoFile.cid,
      downloadUrl: demoFile.cid ? `http://localhost:8081/ipfs/${demoFile.cid}` : null
    });
  })
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
      include: { registration: { select: { applicantId: true } } }
    });

    if (file) {
      if (!(await canAccessPrismaFile(file, user))) throw forbiddenError("Bạn không có quyền kiểm tra tệp này");

      const checks = {
        hasCid: Boolean(file.cid),
        hasHash: Boolean(file.hash),
        storageStatusValid: file.storageStatus === "UPLOADED_IPFS"
      };
      const isValid = checks.hasCid && checks.hasHash && checks.storageStatusValid;

      await writeAuditLog({
        actorId: user.userId,
        action: "FILE_INTEGRITY_CHECKED",
        entityType: "FILE",
        entityId: file.id,
        payload: { isValid, checks }
      });

      return ok(
        res,
        {
          fileId: file.id,
          cid: file.cid,
          hash: file.hash,
          storageStatus: file.storageStatus,
          checks,
          isValid
        },
        isValid ? "Kiểm tra toàn vẹn tệp thành công" : "Phát hiện rủi ro toàn vẹn tệp"
      );
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

    return ok(
      res,
      {
        fileId: demoFile.id,
        cid: demoFile.cid,
        hash: demoFile.hash,
        storageStatus: demoFile.storageStatus,
        checks,
        isValid
      },
      isValid ? "Kiểm tra toàn vẹn tệp thành công" : "Phát hiện rủi ro toàn vẹn tệp"
    );
  })
);
