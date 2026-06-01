import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { ok } from "../../lib/response.js";
import * as validation from "./map.validation.js";
import * as service from "./map.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.mapListSchema.safeParse(req.query ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  return ok(res, await service.list(parsed.data));
});

export const getById = asyncHandler(async (req, res) => {
  return ok(res, await service.getById(String(req.params.landRecordId)));
});

export const upsertGeometry = asyncHandler(async (req, res) => {
  const parsed = validation.geometryUpsertSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.upsertGeometry(String(req.params.landRecordId), parsed.data, actor);
  return ok(res, result, "Đã cập nhật dữ liệu geometry");
});

export const reviewGeometry = asyncHandler(async (req, res) => {
  const parsed = validation.geometryReviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.reviewGeometry(String(req.params.landRecordId), parsed.data, actor);
  return ok(res, result, "Đã review dữ liệu geometry");
});

export const approveOffchain = asyncHandler(async (req, res) => {
  const parsed = validation.approveSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.approve(String(req.params.landRecordId), parsed.data, actor);
  return ok(res, result, "Đã phê duyệt off-chain dữ liệu geometry");
});

export const recordBoundaryHash = asyncHandler(async (req, res) => {
  const parsed = validation.recordBoundaryHashSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const actor = (req as AuthenticatedRequest).user;
  const result = await service.recordBoundaryHash(
    String(req.params.landRecordId),
    parsed.data,
    actor
  );
  return ok(res, result, "Đã ghi nhận boundary hash cho thửa đất");
});

export const getLayers = asyncHandler(async (_req, res) => {
  return ok(res, await service.getLayers());
});
