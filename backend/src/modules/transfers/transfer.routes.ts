import { Router } from "express";
import { z } from "zod";
import { badRequest, created, forbidden, ok } from "../../lib/response.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const transferSchema = z.object({
  landCode: z.string().min(1),
  fromUserId: z.string().min(1).optional(),
  toUserRef: z.string().min(1),
  supportingFileIds: z.array(z.string()).default([])
});

const updateSchema = z.object({
  note: z.string().min(3).optional()
});

export const transferRouter = Router();
const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function findTransferById(id: string) {
  return demoStore.listTransfers().find((item) => item.id === id) ?? null;
}

transferRouter.use(requireAuth);

transferRouter.get("/", requireRoles(allAuthenticatedRoles), (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const items = demoStore.listTransfers();
  const scopedItems = isCitizenRole(user.role) ? items.filter((item) => item.fromUserId === user.userId) : items;
  return ok(res, { items: scopedItems, total: scopedItems.length });
});

transferRouter.get("/:id", requireRoles(allAuthenticatedRoles), (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const transfer = findTransferById(String(req.params.id));
  if (!transfer) return badRequest(res, "Không tìm thấy hồ sơ biến động");
  if (isCitizenRole(user.role) && transfer.fromUserId !== user.userId) {
    return forbidden(res, "Bạn không có quyền xem hồ sơ biến động này");
  }
  return ok(res, transfer);
});

transferRouter.post("/", requireRoles(AUTH_ROLES.citizen), (req, res) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const transfer = demoStore.createTransfer({ ...parsed.data, fromUserId: user.userId });
  return created(res, {
    transferRequestId: transfer.id,
    transferCode: transfer.code,
    status: transfer.status,
    transfer
  }, "Đã tạo hồ sơ đăng ký biến động");
});

transferRouter.post("/:id/confirm", requireRoles(AUTH_ROLES.citizen), (req, res) => {
  const parsed = updateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const existing = findTransferById(String(req.params.id));
  if (!existing) return badRequest(res, "Không tìm thấy hồ sơ biến động");
  if (existing.fromUserId !== user.userId) return forbidden(res, "Bạn không có quyền xác nhận hồ sơ này");
  const transfer = demoStore.updateTransferStatus(
    String(req.params.id),
    "DA_TIEP_NHAN",
    parsed.data.note ?? "Bên nhận đã xác nhận giao dịch"
  );
  return ok(res, transfer, "Đã xác nhận hồ sơ chuyển nhượng");
});

transferRouter.post("/:id/request-supplement", requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER"]), (req, res) => {
  const parsed = updateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const transfer = demoStore.updateTransferStatus(
    String(req.params.id),
    "CAN_BO_SUNG",
    parsed.data.note ?? "Cần bổ sung hồ sơ biến động"
  );
  if (!transfer) return badRequest(res, "Không tìm thấy hồ sơ biến động");
  return ok(res, transfer, "Đã cập nhật yêu cầu bổ sung");
});

transferRouter.post("/:id/complete", requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]), (req, res) => {
  const result = demoStore.completeTransfer(String(req.params.id));
  if (!result) return badRequest(res, "Không tìm thấy hồ sơ biến động hoặc thửa đất liên quan");
  return ok(res, result, "Đã hoàn tất đăng ký biến động do chuyển nhượng");
});
