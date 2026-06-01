import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./user.validation.js";
import * as service from "./user.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listUserSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data));
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createUserSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, authUser);
  return created(res, result, "Created successfully");
});

export const update = asyncHandler(async (req, res) => {
  const parsed = validation.updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.update(String(req.params.id), parsed.data, authUser);
  return ok(res, result);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const parsed = validation.userStatusSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.updateStatus(String(req.params.id), parsed.data, authUser);
  return ok(res, result);
});
