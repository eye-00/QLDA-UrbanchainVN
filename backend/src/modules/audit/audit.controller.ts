import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import * as validation from "./audit.validation.js";
import * as service from "./audit.service.js";

export const queryAccessLogs = asyncHandler(async (req, res) => {
  const parsed = validation.auditQuerySchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.queryAccessLogs(parsed.data));
});

export const queryUserActions = asyncHandler(async (req, res) => {
  const parsed = validation.auditQuerySchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.queryUserActions(parsed.data));
});

export const queryRbacChanges = asyncHandler(async (req, res) => {
  const parsed = validation.auditQuerySchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.queryRbacChanges(parsed.data));
});
