import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import * as service from "./registration.service.js";
import * as validation from "./registration.validation.js";
import {
  toBlockchainTxItem,
  toDocumentVersionItem,
  toPaymentObligationItem,
  toRegistrationItem
} from "./registration.mapper.js";

export const list = asyncHandler(async (req, res) => {
  const parsed = validation.listSchema.safeParse(req.query);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.listRegistrations((req as AuthenticatedRequest).user, parsed.data);
  return ok(res, { items: result.items.map(toRegistrationItem), total: result.total });
});

export const create = asyncHandler(async (req, res) => {
  const parsed = validation.createRegistrationSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const record = await service.createRegistration((req as AuthenticatedRequest).user, parsed.data);
  return created(
    res,
    {
      registrationId: record.id,
      registrationCode: record.code,
      status: record.status,
      registration: toRegistrationItem(record)
    },
    "Đã tạo hồ sơ đăng ký đất đai lần đầu"
  );
});

export const getDetail = asyncHandler(async (req, res) => {
  const record = await service.getRegistrationDetail(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, toRegistrationItem(record));
});

export const getNotificationHistory = asyncHandler(async (req, res) => {
  const result = await service.getNotificationHistory(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, result);
});

export const getDocumentVersions = asyncHandler(async (req, res) => {
  const result = await service.getDocumentVersions(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, {
    items: result.items.map(toDocumentVersionItem),
    total: result.total
  });
});

export const createDocumentVersion = asyncHandler(async (req, res) => {
  const parsed = validation.createDocumentVersionSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const version = await service.createDocumentVersion(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return created(res, toDocumentVersionItem(version), "Đã tạo phiên bản tài liệu mới");
});

export const getSnapshots = asyncHandler(async (req, res) => {
  const result = await service.getSnapshots(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, result);
});

export const getDocumentHistory = asyncHandler(async (req, res) => {
  const result = await service.getDocumentHistory(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, result);
});

export const getPaymentObligations = asyncHandler(async (req, res) => {
  const result = await service.getPaymentObligations(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, {
    items: result.items.map(toPaymentObligationItem),
    total: result.total
  });
});

export const createPaymentObligation = asyncHandler(async (req, res) => {
  const parsed = validation.createPaymentObligationSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const obligation = await service.createPaymentObligation(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return created(res, toPaymentObligationItem(obligation), "Đã tạo nghĩa vụ tài chính");
});

export const updatePaymentObligation = asyncHandler(async (req, res) => {
  const parsed = validation.updatePaymentObligationSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const obligation = await service.updatePaymentObligation(
    String(req.params.id),
    String(req.params.obligationId),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toPaymentObligationItem(obligation), "Đã cập nhật nghĩa vụ tài chính");
});

export const submit = asyncHandler(async (req, res) => {
  const parsed = validation.submitSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.submitRegistration(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã chuyển hồ sơ sang trạng thái chờ tiếp nhận");
});

export const accept = asyncHandler(async (req, res) => {
  const parsed = validation.submitSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.acceptRegistration(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã tiếp nhận hồ sơ hợp lệ");
});

export const reject = asyncHandler(async (req, res) => {
  const parsed = validation.requiredNoteSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.rejectRegistration(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã từ chối hồ sơ");
});

export const patchStatus = asyncHandler(async (req, res) => {
  const parsed = validation.patchStatusSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.patchStatus(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã cập nhật trạng thái hồ sơ");
});

export const communeConfirm = asyncHandler(async (req, res) => {
  const parsed = validation.communeConfirmSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.communeConfirm(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã cập nhật kết quả xác nhận cấp xã");
});

export const taxTransfer = asyncHandler(async (req, res) => {
  const parsed = validation.taxTransferSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.taxTransfer(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã chuyển thông tin nghĩa vụ tài chính");
});

export const approve = asyncHandler(async (req, res) => {
  const parsed = validation.approveSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.approveRegistration(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã phê duyệt hồ sơ đăng ký");
});

export const cadastralUpdate = asyncHandler(async (req, res) => {
  const parsed = validation.cadastralUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.cadastralUpdate(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã ghi nhận cập nhật hồ sơ địa chính");
});

export const supplementRequest = asyncHandler(async (req, res) => {
  const parsed = validation.supplementRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const updated = await service.supplementRequest(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, toRegistrationItem(updated), "Đã cập nhật yêu cầu bổ sung hồ sơ");
});

export const blockchainSync = asyncHandler(async (req, res) => {
  const parsed = validation.blockchainSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);
  const result = await service.blockchainSync(
    String(req.params.id),
    (req as AuthenticatedRequest).user,
    parsed.data
  );
  return ok(res, result, "Đã đồng bộ bản ghi số");
});

export const getBlockchainCandidates = asyncHandler(async (req, res) => {
  const result = await service.getBlockchainCandidates(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, result, "Đã tải danh sách ví công vụ sẵn sàng ký blockchain");
});

export const getBlockchainStatus = asyncHandler(async (req, res) => {
  const result = await service.getBlockchainStatus(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(res, result, "Đã đối soát trạng thái on-chain/off-chain");
});

export const getTxHistory = asyncHandler(async (req, res) => {
  const result = await service.getTxLifecycleHistory(
    String(req.params.id),
    (req as AuthenticatedRequest).user
  );
  return ok(
    res,
    {
      items: result.items.map(toBlockchainTxItem),
      total: result.total
    },
    "Đã tải vòng đời giao dịch blockchain"
  );
});
