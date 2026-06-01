import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./legal.validation.js";
import * as service from "./legal.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listLegalSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data));
});

export const getById = asyncHandler(async (req, res) => {
  return ok(res, await service.getById(String(req.params.procedureCode)));
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createLegalSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, actor);
  return created(res, result, "Đã tạo thủ tục pháp lý");
});

export const update = asyncHandler(async (req, res) => {
  const parsed = validation.updateLegalSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.update(String(req.params.id), parsed.data, actor);
  return ok(res, result, "Đã cập nhật thủ tục pháp lý");
});
