import { Router } from "express";
import multer from "multer";
import { badRequest, created, ok } from "../../lib/response.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles } from "../auth/auth.middleware.js";

const upload = multer({ dest: "tmp/uploads" });
export const fileRouter = Router();

fileRouter.post("/upload", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), upload.single("file"), (req, res) => {
  const originalName = req.file?.originalname ?? req.body.originalName ?? "document.bin";
  const documentType = req.body.documentType || "UNKNOWN";
  const file = demoStore.createFile(originalName, documentType);
  return created(res, file, "Đã tải tệp và lưu metadata IPFS thành công");
});

fileRouter.get("/:fileId", requireAuth, requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]), (req, res) => {
  const file = demoStore.getFile(String(req.params.fileId));
  if (!file) return badRequest(res, "Không tìm thấy file");
  return ok(res, file);
});
