import { badRequestError, forbiddenError } from "../../lib/errors.js";
import { demoStore } from "../../lib/store/demo-store.js";
import { AUTH_ROLES } from "../auth/auth.middleware.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import type { CreateTransferInput, UpdateTransferInput } from "./transfer.validation.js";

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function findTransferById(id: string) {
  return demoStore.listTransfers().find((item) => item.id === id) ?? null;
}

export async function list(user: AuthenticatedRequest["user"]) {
  const items = demoStore.listTransfers();
  const scopedItems = isCitizenRole(user.role)
    ? items.filter((item) => item.fromUserId === user.userId)
    : items;
  return { items: scopedItems, total: scopedItems.length };
}

export async function getById(id: string, user: AuthenticatedRequest["user"]) {
  const transfer = findTransferById(id);
  if (!transfer) throw badRequestError("Không tìm thấy hồ sơ biến động");
  if (isCitizenRole(user.role) && transfer.fromUserId !== user.userId) {
    throw forbiddenError("Bạn không có quyền xem hồ sơ biến động này");
  }
  return transfer;
}

export async function create(data: CreateTransferInput, user: AuthenticatedRequest["user"]) {
  const transfer = demoStore.createTransfer({
    ...data,
    fromUserId: user.userId
  });

  return {
    transferRequestId: transfer.id,
    transferCode: transfer.code,
    status: transfer.status,
    transfer
  };
}

export async function confirm(
  id: string,
  data: UpdateTransferInput,
  user: AuthenticatedRequest["user"]
) {
  const existing = findTransferById(id);
  if (!existing) throw badRequestError("Không tìm thấy hồ sơ biến động");
  if (existing.fromUserId !== user.userId)
    throw forbiddenError("Bạn không có quyền xác nhận hồ sơ này");
  const transfer = demoStore.updateTransferStatus(
    id,
    "DA_TIEP_NHAN",
    data.note ?? "Bên nhận đã xác nhận giao dịch"
  );
  return transfer;
}

export async function supplement(id: string, data: UpdateTransferInput) {
  const transfer = demoStore.updateTransferStatus(
    id,
    "CAN_BO_SUNG",
    data.note ?? "Cần bổ sung hồ sơ biến động"
  );
  if (!transfer) throw badRequestError("Không tìm thấy hồ sơ biến động");
  return transfer;
}

export async function complete(id: string) {
  const result = demoStore.completeTransfer(id);
  if (!result) throw badRequestError("Không tìm thấy hồ sơ biến động hoặc thửa đất liên quan");
  return result;
}
