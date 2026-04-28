import { Router } from "express";
import multer from "multer";
import { badRequest, created, forbidden, ok } from "../../lib/response.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const upload = multer({ dest: "tmp/uploads" });
export const fileRouter = Router();

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function canAccessFile(fileId: string, user: AuthenticatedRequest["user"]) {
  if (!isCitizenRole(user.role)) return true;

  const hasRegistrationFile = demoStore
    .listRegistrations()
    .some((registration) => registration.applicantId === user.userId && registration.fileIds.some((file) => file.id === fileId));

  if (hasRegistrationFile) return true;

  return demoStore
    .listTransfers()
    .some((transfer) => transfer.fromUserId === user.userId && transfer.supportingFileIds.includes(fileId));
}

fileRouter.post("/upload", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), upload.single("file"), (req, res) => {
  const originalName = req.file?.originalname ?? req.body.originalName ?? "document.bin";
  const documentType = req.body.documentType || "UNKNOWN";
  const file = demoStore.createFile(originalName, documentType);
  return created(res, file, "Đã tải tệp và lưu metadata IPFS thành công");
});

fileRouter.get("/:fileId", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const file = demoStore.getFile(String(req.params.fileId));
  if (!file) return badRequest(res, "Không tìm thấy file");
  if (!canAccessFile(String(req.params.fileId), user)) {
    return forbidden(res, "Bạn không có quyền xem file này");
  }
  return ok(res, file);
});

fileRouter.get("/:fileId/download", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const fileId = String(req.params.fileId);
  const file = demoStore.getFile(fileId);
  if (!file) return badRequest(res, "Không tìm thấy file");
  if (!canAccessFile(fileId, user)) {
    return forbidden(res, "Bạn không có quyền tải file này");
  }

  return ok(res, {
    fileId: file.id,
    cid: file.cid,
    downloadUrl: file.cid ? `http://localhost:8081/ipfs/${file.cid}` : null
  });
});
