import {
  PaymentObligationStatus,
  PaymentObligationType,
  Prisma,
  RegistrationStatus
} from "@prisma/client";
import { writeAuditLog } from "../../lib/audit.js";
import { badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, type AuthenticatedRequest } from "../auth/auth.middleware.js";
import type {
  CreatePaymentObligationInput,
  GenerateQrInput,
  ListObligationsInput,
  MockConfirmInput,
  VerifyReceiptInput,
  RecordOnChainInput
} from "./payment-obligation.validation.js";

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function readAuthorityActors(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseNoteHistory(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function appendNoteHistory(value: Prisma.JsonValue | null, note: string) {
  return [...parseNoteHistory(value), note];
}

function toPaymentObligationItem(item: {
  id: string;
  registrationId: string;
  type: PaymentObligationType;
  status: PaymentObligationStatus;
  legalBasisCode: string;
  referenceNo: string | null;
  noticeRef: string | null;
  noticeIssuedAt: Date | null;
  receiptRef: string | null;
  receiptFileId: string | null;
  receiptSubmittedAt: Date | null;
  amount: Prisma.Decimal | null;
  note: string | null;
  createdById: string;
  confirmedById: string | null;
  confirmedAt: Date | null;
  verifiedById: string | null;
  verifiedAt: Date | null;
  verifyNote: string | null;
  evidenceTxHash: string | null;
  evidenceCid: string | null;
  evidenceHash: string | null;
  evidenceRecordedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    registrationId: item.registrationId,
    type: item.type,
    status: item.status,
    legalBasisCode: item.legalBasisCode,
    referenceNo: item.referenceNo,
    noticeRef: item.noticeRef,
    noticeIssuedAt: item.noticeIssuedAt,
    receiptRef: item.receiptRef,
    receiptFileId: item.receiptFileId,
    receiptSubmittedAt: item.receiptSubmittedAt,
    amount: item.amount ? Number(item.amount) : null,
    note: item.note,
    createdById: item.createdById,
    confirmedById: item.confirmedById,
    confirmedAt: item.confirmedAt,
    verifiedById: item.verifiedById,
    verifiedAt: item.verifiedAt,
    verifyNote: item.verifyNote,
    evidenceTxHash: item.evidenceTxHash,
    evidenceCid: item.evidenceCid,
    evidenceHash: item.evidenceHash,
    evidenceRecordedAt: item.evidenceRecordedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function ensureProcedureAuthority(procedureCode: string | null, actorRole: string) {
  if (actorRole === "ADMIN" || isCitizenRole(actorRole)) return;
  if (!procedureCode) throw badRequestError("Hồ sơ chưa gắn procedureCode hợp lệ");
  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode }
  });
  if (!procedure || !procedure.isActive)
    throw badRequestError("Thủ tục pháp lý không tồn tại hoặc không còn hiệu lực");
  const allowedActors = readAuthorityActors(procedure.authorityActors);
  if (!allowedActors.includes(actorRole)) {
    throw forbiddenError(
      `Vai trò ${actorRole} không thuộc authority matrix của thủ tục ${procedure.procedureCode}`
    );
  }
}

async function findObligationOrThrow(id: string) {
  const item = await prisma.registrationPaymentObligation.findUnique({
    where: { id },
    include: {
      registration: {
        select: {
          id: true,
          code: true,
          applicantId: true,
          procedureCode: true
        }
      }
    }
  });
  if (!item) throw notFoundError("Không tìm thấy nghĩa vụ tài chính");
  return item;
}

async function advanceRegistrationAfterPaymentConfirm(
  registrationId: string,
  actor: AuthenticatedRequest["user"],
  legalBasisCode: string,
  note: string
) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true, noteHistory: true }
  });
  if (!registration) return;
  if (registration.status !== "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH") return;

  const nextStatus: RegistrationStatus = "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH";
  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status: nextStatus,
      legalBasisCode,
      noteHistory: appendNoteHistory(
        registration.noteHistory,
        note || "Đã hoàn thành nghĩa vụ tài chính qua top-level payment flow"
      )
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "REGISTRATION_STATUS_UPDATED",
    entityType: "REGISTRATION",
    entityId: updated.id,
    payload: {
      previousStatus: registration.status,
      status: nextStatus,
      legalBasisCode,
      note
    }
  });
}

export async function listObligations(
  actor: AuthenticatedRequest["user"],
  query: ListObligationsInput
) {
  const where: Prisma.RegistrationPaymentObligationWhereInput = {};
  if (query.registrationId) where.registrationId = query.registrationId;
  if (query.status) where.status = query.status as PaymentObligationStatus;

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.registrationPaymentObligation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" }
    }),
    prisma.registrationPaymentObligation.count({ where })
  ]);

  return { items: items.map(toPaymentObligationItem), total };
}

export async function getObligation(actor: AuthenticatedRequest["user"], id: string) {
  const obligation = await findObligationOrThrow(id);
  if (isCitizenRole(actor.role) && obligation.registration.applicantId !== actor.userId) {
    throw forbiddenError("OWNERSHIP_DENIED: Bạn không có quyền xem nghĩa vụ tài chính này");
  }
  return toPaymentObligationItem(obligation);
}

export async function createObligation(
  actor: AuthenticatedRequest["user"],
  body: CreatePaymentObligationInput
) {
  const registration = await prisma.registration.findUnique({
    where: { id: body.registrationId },
    select: { id: true, procedureCode: true }
  });
  if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureProcedureAuthority(registration.procedureCode, actor.role);

  const createdItem = await prisma.registrationPaymentObligation.create({
    data: {
      registrationId: registration.id,
      type: body.type,
      legalBasisCode: body.legalBasisCode,
      referenceNo: body.referenceNo ?? null,
      noticeRef: body.noticeRef ?? null,
      ...(body.noticeRef ? { noticeIssuedAt: new Date() } : {}),
      amount: body.amount ? new Prisma.Decimal(body.amount) : null,
      note: body.note ?? null,
      createdById: actor.userId
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "PAYMENT_OBLIGATION_CREATED",
    entityType: "REGISTRATION_PAYMENT_OBLIGATION",
    entityId: createdItem.id,
    payload: {
      registrationId: registration.id,
      type: createdItem.type,
      legalBasisCode: createdItem.legalBasisCode
    }
  });

  return toPaymentObligationItem(createdItem);
}

export async function generateQrTest(
  actor: AuthenticatedRequest["user"],
  id: string,
  body: GenerateQrInput
) {
  const obligation = await findObligationOrThrow(id);
  await ensureProcedureAuthority(obligation.registration.procedureCode, actor.role);

  const noticeRef = body.noticeRef ?? `NOTICE-${Date.now()}`;
  const updated = await prisma.registrationPaymentObligation.update({
    where: { id: obligation.id },
    data: {
      legalBasisCode: body.legalBasisCode,
      noticeRef,
      noticeIssuedAt: new Date(),
      amount: body.amount ? new Prisma.Decimal(body.amount) : obligation.amount,
      note: body.note ?? obligation.note
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "PAYMENT_NOTICE_ISSUED",
    entityType: "REGISTRATION_PAYMENT_OBLIGATION",
    entityId: updated.id,
    payload: {
      registrationId: updated.registrationId,
      noticeRef: updated.noticeRef,
      legalBasisCode: updated.legalBasisCode
    }
  });

  return toPaymentObligationItem(updated);
}

export async function mockConfirmPayment(
  actor: AuthenticatedRequest["user"],
  id: string,
  body: MockConfirmInput
) {
  const obligation = await findObligationOrThrow(id);
  if (isCitizenRole(actor.role) && obligation.registration.applicantId !== actor.userId) {
    throw forbiddenError("OWNERSHIP_DENIED: Bạn không có quyền nộp biên nhận cho nghĩa vụ này");
  }

  if (!isCitizenRole(actor.role)) {
    await ensureProcedureAuthority(obligation.registration.procedureCode, actor.role);
  }

  if (body.receiptFileId) {
    const receiptFile = await prisma.fileAsset.findUnique({
      where: { id: body.receiptFileId },
      select: { id: true, registrationId: true }
    });
    if (!receiptFile || receiptFile.registrationId !== obligation.registrationId) {
      throw badRequestError("receiptFileId không thuộc hồ sơ đăng ký liên quan");
    }
  }

  const updated = await prisma.registrationPaymentObligation.update({
    where: { id: obligation.id },
    data: {
      legalBasisCode: body.legalBasisCode,
      receiptRef: body.receiptRef ?? obligation.receiptRef,
      receiptFileId: body.receiptFileId ?? obligation.receiptFileId,
      receiptSubmittedAt: new Date(),
      note: body.note ?? obligation.note
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "PAYMENT_RECEIPT_SUBMITTED",
    entityType: "REGISTRATION_PAYMENT_OBLIGATION",
    entityId: updated.id,
    payload: {
      registrationId: updated.registrationId,
      receiptRef: updated.receiptRef,
      receiptFileId: updated.receiptFileId,
      legalBasisCode: updated.legalBasisCode
    }
  });

  return toPaymentObligationItem(updated);
}

export async function verifyReceipt(
  actor: AuthenticatedRequest["user"],
  id: string,
  body: VerifyReceiptInput
) {
  const obligation = await findObligationOrThrow(id);
  await ensureProcedureAuthority(obligation.registration.procedureCode, actor.role);

  if (!obligation.receiptRef && !obligation.receiptFileId) {
    throw conflictError("Không thể xác minh khi chưa có biên nhận nghĩa vụ tài chính");
  }

  const nextStatus: PaymentObligationStatus = body.verified ? "CONFIRMED" : "CANCELLED";
  const updated = await prisma.registrationPaymentObligation.update({
    where: { id: obligation.id },
    data: {
      status: nextStatus,
      legalBasisCode: body.legalBasisCode,
      verifiedById: actor.userId,
      verifiedAt: new Date(),
      verifyNote: body.verifyNote ?? null,
      ...(nextStatus === "CONFIRMED"
        ? { confirmedById: actor.userId, confirmedAt: new Date() }
        : {})
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "PAYMENT_RECEIPT_VERIFIED",
    entityType: "REGISTRATION_PAYMENT_OBLIGATION",
    entityId: updated.id,
    payload: {
      registrationId: updated.registrationId,
      status: updated.status,
      legalBasisCode: updated.legalBasisCode
    }
  });

  if (nextStatus === "CONFIRMED") {
    await advanceRegistrationAfterPaymentConfirm(
      updated.registrationId,
      actor,
      body.legalBasisCode,
      body.verifyNote ?? "Đã hoàn thành nghĩa vụ tài chính"
    );
  }

  return toPaymentObligationItem(updated);
}

export async function recordOnChain(
  actor: AuthenticatedRequest["user"],
  id: string,
  body: RecordOnChainInput
) {
  const obligation = await findObligationOrThrow(id);
  await ensureProcedureAuthority(obligation.registration.procedureCode, actor.role);

  if (obligation.status !== "CONFIRMED") {
    throw conflictError("Chỉ được ghi nhận on-chain khi nghĩa vụ tài chính đã xác nhận");
  }

  const updated = await prisma.registrationPaymentObligation.update({
    where: { id: obligation.id },
    data: {
      legalBasisCode: body.legalBasisCode,
      evidenceTxHash: body.evidenceTxHash,
      evidenceCid: body.evidenceCid ?? null,
      evidenceHash: body.evidenceHash ?? null,
      evidenceRecordedAt: new Date(),
      note: body.note ?? obligation.note
    }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "PAYMENT_EVIDENCE_RECORDED",
    entityType: "REGISTRATION_PAYMENT_OBLIGATION",
    entityId: updated.id,
    payload: {
      registrationId: updated.registrationId,
      evidenceTxHash: updated.evidenceTxHash,
      evidenceCid: updated.evidenceCid,
      evidenceHash: updated.evidenceHash,
      legalBasisCode: updated.legalBasisCode
    }
  });

  return toPaymentObligationItem(updated);
}
