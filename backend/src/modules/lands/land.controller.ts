import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import * as validation from "./land.validation.js";
import * as service from "./land.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.landListSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data));
});

export const search = asyncHandler(async (req, res) => {
  const keyword = typeof req.query.q === "string" ? req.query.q : undefined;
  const parsed = validation.landListSchema.safeParse({
    ...req.query,
    keyword,
    q: undefined
  });
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.search(keyword ?? "", parsed.data));
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.landCreateSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.create(parsed.data, authUser);
  return created(res, result);
});

export const update = asyncHandler(async (req, res) => {
  const parsed = validation.landUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const authUser = (req as AuthenticatedRequest).user;
  const result = await service.update(String(req.params.id), parsed.data, authUser);
  return ok(res, result);
});

export const getById = asyncHandler(async (req, res) => {
  return ok(res, await service.getById(String(req.params.id)));
});
