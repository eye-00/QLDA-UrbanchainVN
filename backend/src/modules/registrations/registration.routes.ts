import { Router } from "express";
import { z } from "zod";
import { badRequest, created, forbidden, ok } from "../../lib/response.js";
import { demoStore, type RegistrationStatus } from "../../lib/store/demo-store.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const createRegistrationSchema = z.object({
  applicantId: z.string().min(1).optional(),
  landInfo: z.object({
    provinceCode: z.string().min(1),
    districtName: z.string().min(1),
    communeName: z.string().min(1),
    parcelNumber: z.string().min(1),
    mapSheetNumber: z.string().min(1),
    area: z.number().positive(),
    landUsePurpose: z.string().min(1),
    address: z.string().min(1)
  }),
  ownerInfo: z.object({
    ownerType: z.string().min(1),
    fullName: z.string().min(2),
    identityNumber: z.string().optional()
  }),
  fileIds: z.array(z.string()).default([])
});

const updateStatusSchema = z.object({
  note: z.string().min(3).optional(),
  actorRole: z.string().optional()
});

const requiredNoteSchema = z.object({
  note: z.string().min(3),
  actorRole: z.string().optional()
});

const approveSchema = z.object({
  note: z.string().min(3).optional(),
  txHash: z.string().optional(),
  landCode: z.string().optional()
});

const listSchema = z.object({
  status: z.string().optional()
});

export const registrationRouter = Router();
const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

registrationRouter.use(requireAuth);

registrationRouter.get("/", requireRoles(allAuthenticatedRoles), (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const status = parsed.data.status as RegistrationStatus | undefined;
  const user = (req as AuthenticatedRequest).user;
  const items = demoStore.listRegistrations(status);
  const scopedItems = isCitizenRole(user.role) ? items.filter((item) => item.applicantId === user.userId) : items;
  return ok(res, { items: scopedItems, total: scopedItems.length });
});

registrationRouter.post("/", requireRoles(AUTH_ROLES.citizen), (req, res) => {
  const parsed = createRegistrationSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;

  const record = demoStore.createRegistration({
    applicantId: user.userId,
    ownerFullName: parsed.data.ownerInfo.fullName,
    ownerType: parsed.data.ownerInfo.ownerType,
    identityNumber: parsed.data.ownerInfo.identityNumber,
    provinceCode: parsed.data.landInfo.provinceCode,
    districtName: parsed.data.landInfo.districtName,
    communeName: parsed.data.landInfo.communeName,
    parcelNumber: parsed.data.landInfo.parcelNumber,
    mapSheetNumber: parsed.data.landInfo.mapSheetNumber,
    area: parsed.data.landInfo.area,
    landUsePurpose: parsed.data.landInfo.landUsePurpose,
    address: parsed.data.landInfo.address,
    fileIds: parsed.data.fileIds.map((id) => ({ id, documentType: demoStore.getFile(id)?.documentType ?? "UNKNOWN" }))
  });

  return created(res, {
    registrationId: record.id,
    registrationCode: record.code,
    status: record.status,
    registration: record
  }, "Đã tạo hồ sơ đăng ký đất đai lần đầu");
});

registrationRouter.get("/:id", requireRoles(allAuthenticatedRoles), (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const record = demoStore.getRegistration(String(req.params.id));
  if (!record) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  if (isCitizenRole(user.role) && record.applicantId !== user.userId) {
    return forbidden(res, "Bạn không có quyền xem hồ sơ này");
  }
  return ok(res, record);
});

registrationRouter.post("/:id/submit", requireRoles(AUTH_ROLES.citizen), (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const user = (req as AuthenticatedRequest).user;
  const existing = demoStore.getRegistration(String(req.params.id));
  if (!existing) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  if (existing.applicantId !== user.userId) return forbidden(res, "Bạn không có quyền nộp hồ sơ này");
  const record = demoStore.updateRegistrationStatus(
    String(req.params.id),
    "CHO_TIEP_NHAN",
    parsed.data.note ?? "Người dân đã nộp hồ sơ vào luồng tiếp nhận"
  );
  return ok(res, record, "Đã chuyển hồ sơ sang trạng thái chờ tiếp nhận");
});

registrationRouter.post("/:id/request-supplement", requireRoles(["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER"]), (req, res) => {
  const parsed = requiredNoteSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const record = demoStore.updateRegistrationStatus(
    String(req.params.id),
    "CAN_BO_SUNG",
    parsed.data.note
  );
  if (!record) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  return ok(res, record, "Đã cập nhật yêu cầu bổ sung hồ sơ");
});

registrationRouter.post("/:id/accept", requireRoles(["RECEPTION_OFFICER"]), (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const record = demoStore.updateRegistrationStatus(
    String(req.params.id),
    "DA_TIEP_NHAN",
    parsed.data.note ?? "Bộ phận một cửa đã tiếp nhận hồ sơ"
  );
  if (!record) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  return ok(res, record, "Đã tiếp nhận hồ sơ hợp lệ");
});

registrationRouter.post("/:id/approve", requireRoles(["APPROVAL_AUTHORITY", "ADMIN"]), (req, res) => {
  const parsed = approveSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const result = demoStore.approveRegistration(String(req.params.id), parsed.data.txHash);
  if (!result) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  if (parsed.data.landCode) result.registration.landCode = parsed.data.landCode;
  return ok(res, result, "Đã phê duyệt hồ sơ và tạo bản ghi đất đai");
});

registrationRouter.post("/:id/reject", requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"]), (req, res) => {
  const parsed = requiredNoteSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, "Validation error", parsed.error.issues);
  const record = demoStore.updateRegistrationStatus(
    String(req.params.id),
    "TU_CHOI",
    parsed.data.note
  );
  if (!record) return badRequest(res, "Không tìm thấy hồ sơ đăng ký");
  return ok(res, record, "Đã từ chối hồ sơ");
});
