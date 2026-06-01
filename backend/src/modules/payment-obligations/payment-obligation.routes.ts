import {
  PaymentObligationStatus,
  PaymentObligationType,
  Prisma,
  RegistrationStatus,
} from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import {
  asyncHandler,
  badRequestError,
  conflictError,
  forbiddenError,
  notFoundError,
} from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import {
  AUTH_ROLES,
  requireAuth,
  requireRoles,
  type AuthenticatedRequest,
} from "../auth/auth.middleware.js";

const legalBasisCodeSchema = z.string().min(3).max(191);

const createPaymentObligationSchema = z.object({
  registrationId: z.string().min(3),
  type: z.enum([
    "INTAKE_FEE",
    "LAND_FINANCIAL_OBLIGATION",
    "REGISTRATION_FEE",
    "LATE_FEE",
    "OTHER_LEGAL_FEE",
  ]),
  legalBasisCode: legalBasisCodeSchema,
  referenceNo: z.string().min(3).optional(),
  noticeRef: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional(),
});

const generateQrSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  noticeRef: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional(),
});

const mockConfirmSchema = z
  .object({
    legalBasisCode: legalBasisCodeSchema,
    receiptRef: z.string().min(3).optional(),
    receiptFileId: z.string().min(3).optional(),
    note: z.string().min(3).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.receiptRef && !value.receiptFileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receiptRef"],
        message: "receiptRef hoặc receiptFileId là bắt buộc",
      });
    }
  });

const verifyReceiptSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  verified: z.boolean(),
  verifyNote: z.string().min(3).optional(),
});

const recordOnChainSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  evidenceTxHash: z.string().min(6),
  evidenceCid: z.string().min(3).optional(),
  evidenceHash: z.string().min(3).optional(),
  note: z.string().min(3).optional(),
});

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(
    role as (typeof AUTH_ROLES.citizen)[number],
  );
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
    updatedAt: item.updatedAt,
  };
}

async function ensureProcedureAuthority(
  procedureCode: string | null,
  actorRole: string,
) {
  if (actorRole === "ADMIN" || isCitizenRole(actorRole)) return;
  if (!procedureCode)
    throw badRequestError("Hồ sơ chưa gắn procedureCode hợp lệ");
  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode },
  });
  if (!procedure || !procedure.isActive)
    throw badRequestError(
      "Thủ tục pháp lý không tồn tại hoặc không còn hiệu lực",
    );
  const allowedActors = readAuthorityActors(procedure.authorityActors);
  if (!allowedActors.includes(actorRole)) {
    throw forbiddenError(
      `Vai trò ${actorRole} không thuộc authority matrix của thủ tục ${procedure.procedureCode}`,
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
          procedureCode: true,
        },
      },
    },
  });
  if (!item) throw notFoundError("Không tìm thấy nghĩa vụ tài chính");
  return item;
}

async function advanceRegistrationAfterPaymentConfirm(
  registrationId: string,
  actor: AuthenticatedRequest["user"],
  legalBasisCode: string,
  note: string,
) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, status: true, noteHistory: true },
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
        note || "Đã hoàn thành nghĩa vụ tài chính qua top-level payment flow",
      ),
    },
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
      note,
    },
  });
}

export const paymentObligationRouter = Router();
paymentObligationRouter.use(requireAuth);

paymentObligationRouter.post(
  "/",
  requireRoles(["TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = createPaymentObligationSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const actor = (req as AuthenticatedRequest).user;
    const registration = await prisma.registration.findUnique({
      where: { id: parsed.data.registrationId },
      select: { id: true, procedureCode: true },
    });
    if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureProcedureAuthority(registration.procedureCode, actor.role);

    const createdItem = await prisma.registrationPaymentObligation.create({
      data: {
        registrationId: registration.id,
        type: parsed.data.type,
        legalBasisCode: parsed.data.legalBasisCode,
        referenceNo: parsed.data.referenceNo ?? null,
        noticeRef: parsed.data.noticeRef ?? null,
        ...(parsed.data.noticeRef ? { noticeIssuedAt: new Date() } : {}),
        amount: parsed.data.amount
          ? new Prisma.Decimal(parsed.data.amount)
          : null,
        note: parsed.data.note ?? null,
        createdById: actor.userId,
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "PAYMENT_OBLIGATION_CREATED",
      entityType: "REGISTRATION_PAYMENT_OBLIGATION",
      entityId: createdItem.id,
      payload: {
        registrationId: registration.id,
        type: createdItem.type,
        legalBasisCode: createdItem.legalBasisCode,
      },
    });

    return created(
      res,
      toPaymentObligationItem(createdItem),
      "Đã tạo nghĩa vụ tài chính",
    );
  }),
);

paymentObligationRouter.get(
  "/:id",
  requireRoles([...AUTH_ROLES.citizen, ...AUTH_ROLES.officers]),
  asyncHandler(async (req, res) => {
    const actor = (req as AuthenticatedRequest).user;
    const obligation = await findObligationOrThrow(String(req.params.id));
    if (
      isCitizenRole(actor.role) &&
      obligation.registration.applicantId !== actor.userId
    ) {
      throw forbiddenError(
        "OWNERSHIP_DENIED: Bạn không có quyền xem nghĩa vụ tài chính này",
      );
    }
    return ok(res, toPaymentObligationItem(obligation));
  }),
);

paymentObligationRouter.post(
  "/:id/generate-qr-test",
  requireRoles(["TAX_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = generateQrSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const obligation = await findObligationOrThrow(String(req.params.id));
    await ensureProcedureAuthority(
      obligation.registration.procedureCode,
      actor.role,
    );

    const noticeRef = parsed.data.noticeRef ?? `NOTICE-${Date.now()}`;
    const updated = await prisma.registrationPaymentObligation.update({
      where: { id: obligation.id },
      data: {
        legalBasisCode: parsed.data.legalBasisCode,
        noticeRef,
        noticeIssuedAt: new Date(),
        amount: parsed.data.amount
          ? new Prisma.Decimal(parsed.data.amount)
          : obligation.amount,
        note: parsed.data.note ?? obligation.note,
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "PAYMENT_NOTICE_ISSUED",
      entityType: "REGISTRATION_PAYMENT_OBLIGATION",
      entityId: updated.id,
      payload: {
        registrationId: updated.registrationId,
        noticeRef: updated.noticeRef,
        legalBasisCode: updated.legalBasisCode,
      },
    });

    return ok(
      res,
      toPaymentObligationItem(updated),
      "Đã tạo thông báo/QR test",
    );
  }),
);

paymentObligationRouter.post(
  "/:id/mock-confirm",
  requireRoles([
    "CITIZEN",
    "BUSINESS",
    "TAX_OFFICER",
    "LAND_REGISTRY_OFFICER",
    "ADMIN",
  ]),
  asyncHandler(async (req, res) => {
    const parsed = mockConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);

    const actor = (req as AuthenticatedRequest).user;
    const obligation = await findObligationOrThrow(String(req.params.id));
    if (
      isCitizenRole(actor.role) &&
      obligation.registration.applicantId !== actor.userId
    ) {
      throw forbiddenError(
        "OWNERSHIP_DENIED: Bạn không có quyền nộp biên nhận cho nghĩa vụ này",
      );
    }

    if (!isCitizenRole(actor.role)) {
      await ensureProcedureAuthority(
        obligation.registration.procedureCode,
        actor.role,
      );
    }

    if (parsed.data.receiptFileId) {
      const receiptFile = await prisma.fileAsset.findUnique({
        where: { id: parsed.data.receiptFileId },
        select: { id: true, registrationId: true },
      });
      if (
        !receiptFile ||
        receiptFile.registrationId !== obligation.registrationId
      ) {
        throw badRequestError(
          "receiptFileId không thuộc hồ sơ đăng ký liên quan",
        );
      }
    }

    const updated = await prisma.registrationPaymentObligation.update({
      where: { id: obligation.id },
      data: {
        legalBasisCode: parsed.data.legalBasisCode,
        receiptRef: parsed.data.receiptRef ?? obligation.receiptRef,
        receiptFileId: parsed.data.receiptFileId ?? obligation.receiptFileId,
        receiptSubmittedAt: new Date(),
        note: parsed.data.note ?? obligation.note,
      },
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
        legalBasisCode: updated.legalBasisCode,
      },
    });

    return ok(
      res,
      toPaymentObligationItem(updated),
      "Đã ghi nhận biên nhận nghĩa vụ tài chính",
    );
  }),
);

paymentObligationRouter.post(
  "/:id/verify-receipt",
  requireRoles(["TAX_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = verifyReceiptSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const obligation = await findObligationOrThrow(String(req.params.id));
    await ensureProcedureAuthority(
      obligation.registration.procedureCode,
      actor.role,
    );

    if (!obligation.receiptRef && !obligation.receiptFileId) {
      throw conflictError(
        "Không thể xác minh khi chưa có biên nhận nghĩa vụ tài chính",
      );
    }

    const nextStatus: PaymentObligationStatus = parsed.data.verified
      ? "CONFIRMED"
      : "CANCELLED";
    const updated = await prisma.registrationPaymentObligation.update({
      where: { id: obligation.id },
      data: {
        status: nextStatus,
        legalBasisCode: parsed.data.legalBasisCode,
        verifiedById: actor.userId,
        verifiedAt: new Date(),
        verifyNote: parsed.data.verifyNote ?? null,
        ...(nextStatus === "CONFIRMED"
          ? { confirmedById: actor.userId, confirmedAt: new Date() }
          : {}),
      },
    });

    await writeAuditLog({
      actorId: actor.userId,
      action: "PAYMENT_RECEIPT_VERIFIED",
      entityType: "REGISTRATION_PAYMENT_OBLIGATION",
      entityId: updated.id,
      payload: {
        registrationId: updated.registrationId,
        status: updated.status,
        legalBasisCode: updated.legalBasisCode,
      },
    });

    if (nextStatus === "CONFIRMED") {
      await advanceRegistrationAfterPaymentConfirm(
        updated.registrationId,
        actor,
        parsed.data.legalBasisCode,
        parsed.data.verifyNote ?? "Đã hoàn thành nghĩa vụ tài chính",
      );
    }

    return ok(
      res,
      toPaymentObligationItem(updated),
      "Đã xác minh biên nhận nghĩa vụ tài chính",
    );
  }),
);

paymentObligationRouter.post(
  "/:id/record-on-chain",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = recordOnChainSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      throw badRequestError("Validation error", parsed.error.issues);
    const actor = (req as AuthenticatedRequest).user;
    const obligation = await findObligationOrThrow(String(req.params.id));
    await ensureProcedureAuthority(
      obligation.registration.procedureCode,
      actor.role,
    );

    if (obligation.status !== "CONFIRMED") {
      throw conflictError(
        "Chỉ được ghi nhận on-chain khi nghĩa vụ tài chính đã xác nhận",
      );
    }

    const updated = await prisma.registrationPaymentObligation.update({
      where: { id: obligation.id },
      data: {
        legalBasisCode: parsed.data.legalBasisCode,
        evidenceTxHash: parsed.data.evidenceTxHash,
        evidenceCid: parsed.data.evidenceCid ?? null,
        evidenceHash: parsed.data.evidenceHash ?? null,
        evidenceRecordedAt: new Date(),
        note: parsed.data.note ?? obligation.note,
      },
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
        legalBasisCode: updated.legalBasisCode,
      },
    });

    return ok(
      res,
      toPaymentObligationItem(updated),
      "Đã ghi nhận bằng chứng on-chain cho nghĩa vụ tài chính",
    );
  }),
);
