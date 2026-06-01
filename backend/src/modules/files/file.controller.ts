import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./file.validation.js";
import * as service from "./file.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const upload = asyncHandler(async (req, res) => {
  const parsed = validation.uploadFileSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const result = await service.upload(parsed.data, req.file, user);
  return created(res, result, "Đã tải tệp và lưu metadata IPFS thành công");
});

export const getDetail = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await service.getDetail(String(req.params.fileId), user);
  return ok(res, result);
});

export const downloadUrl = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await service.downloadUrl(String(req.params.fileId), user);
  return ok(res, result);
});

export const integrityCheck = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await service.integrityCheck(String(req.params.fileId), user);
  const message = result.isValid
    ? "Kiểm tra toàn vẹn tệp thành công"
    : "Phát hiện rủi ro toàn vẹn tệp";
  return ok(res, result, message);
});
