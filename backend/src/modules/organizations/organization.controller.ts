import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./organization.validation.js";
import * as service from "./organization.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listOrgSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data));
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createOrgSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, authUser);
  return created(res, result);
});

export const update = asyncHandler(async (req, res) => {
  const parsed = validation.updateOrgSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.update(String(req.params.id), parsed.data, authUser);
  return ok(res, result);
});

export const deactivate = asyncHandler(async (req, res) => {
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.deactivate(String(req.params.id), authUser);
  return ok(res, result, "Organization deactivated");
});
