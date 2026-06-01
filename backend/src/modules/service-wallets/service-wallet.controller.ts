import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./service-wallet.validation.js";
import * as service from "./service-wallet.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listAuthorizationSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data), "Service wallet authorizations loaded");
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createAuthorizationSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, actor);
  return created(res, result, "Đã cấp quyền ví công vụ");
});

export const updateStatus = asyncHandler(async (req, res) => {
  const parsed = validation.updateAuthorizationSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.update(String(req.params.id), parsed.data, actor);
  return ok(res, result, "Đã cập nhật trạng thái ví công vụ");
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await service.getAuditLogs(String(req.params.id));
  return ok(res, result, "Đã tải nhật ký ví công vụ");
});
