import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import * as service from "./payment-obligation.service.js";
import * as validation from "./payment-obligation.validation.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listObligationsSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.listObligations((req as AuthenticatedRequest).user, parsed.data);
  return ok(res, { items: result.items, total: result.total });
});

export const getById = asyncHandler(async (req, res) => {
  const result = await service.getObligation(
    (req as AuthenticatedRequest).user,
    String(req.params.id)
  );
  return ok(res, result);
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createPaymentObligationSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.createObligation((req as AuthenticatedRequest).user, parsed.data);
  return created(res, result, "Đã tạo nghĩa vụ tài chính");
});

export const generateQr = asyncHandler(async (req, res) => {
  const parsed = validation.generateQrSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.generateQrTest(
    (req as AuthenticatedRequest).user,
    String(req.params.id),
    parsed.data
  );
  return ok(res, result, "Đã tạo thông báo/QR test");
});

export const mockConfirm = asyncHandler(async (req, res) => {
  const parsed = validation.mockConfirmSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.mockConfirmPayment(
    (req as AuthenticatedRequest).user,
    String(req.params.id),
    parsed.data
  );
  return ok(res, result, "Đã ghi nhận biên nhận nghĩa vụ tài chính");
});

export const verifyReceipt = asyncHandler(async (req, res) => {
  const parsed = validation.verifyReceiptSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.verifyReceipt(
    (req as AuthenticatedRequest).user,
    String(req.params.id),
    parsed.data
  );
  return ok(res, result, "Đã xác minh biên nhận nghĩa vụ tài chính");
});

export const recordOnChain = asyncHandler(async (req, res) => {
  const parsed = validation.recordOnChainSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.recordOnChain(
    (req as AuthenticatedRequest).user,
    String(req.params.id),
    parsed.data
  );
  return ok(res, result, "Đã ghi nhận bằng chứng on-chain cho nghĩa vụ tài chính");
});
