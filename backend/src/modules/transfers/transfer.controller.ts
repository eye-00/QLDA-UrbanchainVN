import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./transfer.validation.js";
import * as service from "./transfer.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  return ok(res, await service.list(user));
});

export const getById = asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  return ok(res, await service.getById(String(req.params.id), user));
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createTransferSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, user);
  return created(res, result, "Đã tạo hồ sơ đăng ký biến động");
});

export const confirm = asyncHandler(async (req, res) => {
  const parsed = validation.updateTransferSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const result = await service.confirm(String(req.params.id), parsed.data, user);
  return ok(res, result, "Đã xác nhận hồ sơ chuyển nhượng");
});

export const requestSupplement = asyncHandler(async (req, res) => {
  const parsed = validation.updateTransferSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.supplement(String(req.params.id), parsed.data);
  return ok(res, result, "Đã cập nhật yêu cầu bổ sung");
});

export const complete = asyncHandler(async (req, res) => {
  const result = await service.complete(String(req.params.id));
  return ok(res, result, "Đã hoàn tất đăng ký biến động do chuyển nhượng");
});
