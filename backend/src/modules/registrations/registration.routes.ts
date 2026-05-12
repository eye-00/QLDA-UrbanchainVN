import {
  PaymentObligationType,
  Prisma,
  RegistrationStatus,
  UserRole
} from "@prisma/client";
import { Router } from "express";
import { ethers } from "ethers";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { registerLandOnChain, syncLandMetadataOnChain, toChainSafeHash } from "../../lib/blockchain.js";
import { asyncHandler, badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { created, ok } from "../../lib/response.js";
import { prisma } from "../../lib/prisma.js";
import { AUTH_ROLES, requireAuth, requireRoles, type AuthenticatedRequest } from "../auth/auth.middleware.js";

const registrationStatusSchema = z.enum([
  "MOI_TAO",
  "CHO_TIEP_NHAN",
  "CAN_BO_SUNG",
  "DA_TIEP_NHAN",
  "CHO_XAC_NHAN_CAP_XA",
  "DA_XAC_NHAN_CAP_XA",
  "DANG_THAM_DINH_VPDKDD",
  "CHO_THUE",
  "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "CHO_KY_CAP",
  "DA_KY_CAP",
  "DA_CAP_NHAT_HO_SO_DIA_CHINH",
  "DA_GHI_BLOCKCHAIN",
  "DA_CAP",
  "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "DA_CAP_NHAT_HO_SO_DIA_CHINH",
  "DA_GHI_BLOCKCHAIN",
  "DA_TRA_KET_QUA",
  "HUY_HO_SO",
  "TU_CHOI"
]);

const legalBasisCodeSchema = z.string().min(3).max(191);

const createRegistrationSchema = z.object({
  landInfo: z.object({
    provinceCode: z.string().min(1),
    communeName: z.string().min(1),
    parcelNumber: z.string().min(1),
    mapSheetNumber: z.string().min(1),
    area: z.coerce.number().positive(),
    landUsePurpose: z.string().min(1),
    address: z.string().min(1)
  }),
  ownerInfo: z.object({
    ownerType: z.string().min(1).default("INDIVIDUAL"),
    fullName: z.string().min(2),
    identityNumber: z.string().optional(),
    address: z.string().optional()
  }),
  procedureCode: z.string().min(3).optional(),
  legalBasisCode: z.string().min(3).optional(),
  attachedFileIds: z.array(z.string()).optional(),
  fileIds: z.array(z.string()).optional()
});

const listSchema = z.object({
  status: registrationStatusSchema.optional(),
  keyword: z.string().optional(),
  procedureCode: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const submitSchema = z.object({
  note: z.string().min(3).optional(),
  procedureCode: z.string().min(3).optional(),
  legalBasisCode: z.string().min(3).optional()
});

const legalTransitionSchema = z.object({
  procedureCode: z.string().min(3),
  legalBasisCode: z.string().min(3),
  reason: z.string().min(3),
  evidenceIds: z.array(z.string().min(1)).default([])
});

const patchStatusSchema = z
  .object({
    status: registrationStatusSchema,
    reason: z.string().min(3).optional(),
    procedureCode: z.string().min(3),
    legalBasisCode: z.string().min(3),
    evidenceIds: z.array(z.string().min(1)).default([])
  })
  .superRefine((value, ctx) => {
    if ((value.status === "CAN_BO_SUNG" || value.status === "TU_CHOI" || value.status === "HUY_HO_SO") && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason is required for supplement/reject status"
      });
    }
  });

const communeConfirmSchema = z
  .object({
    confirmed: z.boolean(),
    notes: z.string().min(3).optional()
  })
  .and(legalTransitionSchema);

const taxTransferSchema = z
  .object({
    taxReferenceNo: z.string().min(3),
    notes: z.string().min(3).optional()
  })
  .and(legalTransitionSchema);

const approveSchema = z
  .object({
    approvalNumber: z.string().min(3).optional(),
    approvalDate: z.string().optional(),
    note: z.string().min(3).optional(),
    txHash: z.string().optional(),
    landCode: z.string().optional()
  })
  .and(legalTransitionSchema);

const blockchainSyncSchema = z
  .object({
    cid: z.string().min(3),
    metadataHash: z.string().min(3)
  })
  .and(legalTransitionSchema);

const requiredNoteSchema = z
  .object({
    note: z.string().min(3)
  })
  .and(legalTransitionSchema);

const cadastralUpdateSchema = legalTransitionSchema;

const supplementRequestSchema = z
  .object({
    legalBasisCode: legalBasisCodeSchema,
    note: z.string().min(3),
    missingItems: z.array(z.string().min(2)).min(1),
    deadlineAt: z.string().datetime()
  })
  .superRefine((value, ctx) => {
    const deadline = new Date(value.deadlineAt);
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadlineAt"],
        message: "deadlineAt must be a valid future datetime"
      });
    }
  });

const createDocumentVersionSchema = z.object({
  documentType: z.string().min(1),
  storageStatus: z.string().min(1).default("UPLOADED_IPFS"),
  fileAssetId: z.string().optional(),
  cid: z.string().optional(),
  hash: z.string().optional(),
  note: z.string().optional()
});

const createPaymentObligationSchema = z.object({
  type: z.enum(["INTAKE_FEE", "LAND_FINANCIAL_OBLIGATION"]),
  legalBasisCode: legalBasisCodeSchema,
  referenceNo: z.string().min(3).optional(),
  amount: z.coerce.number().positive().optional(),
  note: z.string().min(3).optional()
});

const updatePaymentObligationSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

const allAuthenticatedRoles = [...AUTH_ROLES.citizen, ...AUTH_ROLES.officers];
type RegistrationActionKey =
  | "submit"
  | "accept"
  | "requestSupplement"
  | "communeConfirm"
  | "taxTransfer"
  | "approve"
  | "cadastralUpdate"
  | "blockchainSync"
  | "reject";

const processingStatuses: RegistrationStatus[] = [
  "CHO_TIEP_NHAN",
  "DA_TIEP_NHAN",
  "CHO_XAC_NHAN_CAP_XA",
  "DA_XAC_NHAN_CAP_XA",
  "DANG_THAM_DINH_VPDKDD",
  "CHO_THUE",
  "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
  "CHO_KY_CAP",
  "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH"
];

const ACTION_ALLOWED_STATUS: Record<RegistrationActionKey, RegistrationStatus[]> = {
  submit: ["MOI_TAO", "CAN_BO_SUNG"],
  accept: ["CHO_TIEP_NHAN", "CAN_BO_SUNG"],
  requestSupplement: processingStatuses,
  communeConfirm: ["CHO_XAC_NHAN_CAP_XA"],
  taxTransfer: ["DA_XAC_NHAN_CAP_XA", "DANG_THAM_DINH_VPDKDD"],
  approve: ["CHO_KY_CAP", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH"],
  cadastralUpdate: ["DA_KY_CAP", "DA_CAP"],
  blockchainSync: ["DA_CAP_NHAT_HO_SO_DIA_CHINH"],
  reject: processingStatuses
};

const ALLOWED_STATUS_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  MOI_TAO: ["CHO_TIEP_NHAN", "CAN_BO_SUNG"],
  CHO_TIEP_NHAN: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "TU_CHOI"],
  CAN_BO_SUNG: ["CHO_TIEP_NHAN", "DA_TIEP_NHAN", "TU_CHOI"],
  DA_TIEP_NHAN: ["CHO_XAC_NHAN_CAP_XA", "CAN_BO_SUNG", "TU_CHOI"],
  CHO_XAC_NHAN_CAP_XA: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG", "TU_CHOI"],
  DA_XAC_NHAN_CAP_XA: ["DANG_THAM_DINH_VPDKDD", "CHO_THUE", "CAN_BO_SUNG", "TU_CHOI"],
  DANG_THAM_DINH_VPDKDD: ["CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI", "HUY_HO_SO"],
  CHO_THUE: ["CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI", "HUY_HO_SO"],
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI", "HUY_HO_SO"],
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI", "HUY_HO_SO"],
  CHO_KY_CAP: ["DA_KY_CAP", "DA_CAP", "CAN_BO_SUNG", "TU_CHOI", "HUY_HO_SO"],
  DA_KY_CAP: ["DA_CAP", "DA_CAP_NHAT_HO_SO_DIA_CHINH"],
  DA_CAP: ["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_TRA_KET_QUA"],
  DA_CAP_NHAT_HO_SO_DIA_CHINH: ["DA_GHI_BLOCKCHAIN", "DA_TRA_KET_QUA"],
  DA_GHI_BLOCKCHAIN: ["DA_TRA_KET_QUA"],
  DA_TRA_KET_QUA: [],
  TU_CHOI: [],
  HUY_HO_SO: []
};

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

async function ensureAttachableFileIdsForApplicant(fileIds: string[], applicantId: string) {
  if (fileIds.length === 0) return [];

  const uniqueFileIds = [...new Set(fileIds)];
  const files = await prisma.fileAsset.findMany({
    where: { id: { in: uniqueFileIds } },
    select: {
      id: true,
      ownerId: true,
      registration: { select: { applicantId: true } }
    }
  });

  if (files.length !== uniqueFileIds.length) {
    throw badRequestError("Một hoặc nhiều fileId không tồn tại hoặc không hợp lệ");
  }

  const invalidFile = files.find(
    (file) => file.ownerId !== applicantId && file.registration?.applicantId !== applicantId
  );
  if (invalidFile) {
    throw forbiddenError("Bạn không có quyền đính kèm một hoặc nhiều tệp hồ sơ");
  }

  return uniqueFileIds;
}

function ensureActionAllowedByStatus(action: RegistrationActionKey, currentStatus: RegistrationStatus) {
  const allowedStatuses = ACTION_ALLOWED_STATUS[action];
  if (allowedStatuses.includes(currentStatus)) return;
  throw conflictError(
    `Không thể thực hiện thao tác ${action} khi hồ sơ đang ở trạng thái ${currentStatus}`,
    [{ code: "INVALID_STATUS_TRANSITION", action, currentStatus, allowedStatuses }]
  );
}

function ensureStatusTransitionAllowed(currentStatus: RegistrationStatus, nextStatus: RegistrationStatus) {
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
  if (allowedNextStatuses.includes(nextStatus)) return;
  throw conflictError(
    `Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`,
    [{ code: "INVALID_STATUS_TRANSITION", currentStatus, nextStatus, allowedNextStatuses }]
  );
}

function parseNoteHistory(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function appendNoteHistory(value: Prisma.JsonValue | null, note: string) {
  return [...parseNoteHistory(value), note];
}

function readJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function parseStringArrayFromJson(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

type LegalTransitionInput = {
  procedureCode: string;
  legalBasisCode: string;
  reason: string;
  evidenceIds: string[];
};

async function ensureLegalTransitionAllowed(
  registration: { procedureCode: string | null },
  actorRole: UserRole,
  legalInput: LegalTransitionInput
) {
  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode: legalInput.procedureCode }
  });
  if (!procedure || !procedure.isActive) {
    throw badRequestError("procedureCode không hợp lệ hoặc đã ngừng áp dụng");
  }

  const authorityActors = parseStringArrayFromJson(procedure.authorityActors);
  if (!authorityActors.includes(actorRole)) {
    throw forbiddenError(`Vai trò ${actorRole} không có thẩm quyền với thủ tục ${legalInput.procedureCode}`);
  }

  if (registration.procedureCode && registration.procedureCode !== legalInput.procedureCode) {
    throw conflictError("procedureCode không khớp với hồ sơ đang xử lý");
  }
}

async function ensureDocumentVersions(registrationId: string, actorId: string) {
  const files = await prisma.fileAsset.findMany({
    where: { registrationId },
    select: {
      id: true,
      documentType: true,
      cid: true,
      hash: true
    }
  });

  for (const file of files) {
    const latest = await prisma.registrationDocumentVersion.findFirst({
      where: { registrationId, fileAssetId: file.id },
      orderBy: { versionNo: "desc" },
      select: { versionNo: true }
    });
    if (latest) continue;

    await prisma.registrationDocumentVersion.create({
      data: {
        registrationId,
        fileAssetId: file.id,
        documentType: file.documentType,
        versionNo: 1,
        cid: file.cid,
        hash: file.hash,
        createdBy: actorId
      }
    });
  }
}

async function createSubmitSnapshot(
  registrationId: string,
  actorId: string,
  actorRole: UserRole,
  legalInput: Pick<LegalTransitionInput, "procedureCode" | "legalBasisCode">
) {
  const versions = await prisma.registrationDocumentVersion.findMany({
    where: { registrationId },
    orderBy: [{ createdAt: "desc" }, { versionNo: "desc" }],
    select: { id: true, fileAssetId: true }
  });
  const latestSnapshot = await prisma.registrationSubmitSnapshot.findFirst({
    where: { registrationId },
    orderBy: { snapshotNo: "desc" },
    select: { snapshotNo: true }
  });

  await prisma.registrationSubmitSnapshot.create({
    data: {
      registrationId,
      snapshotNo: (latestSnapshot?.snapshotNo ?? 0) + 1,
      submittedBy: actorId,
      procedureCode: legalInput.procedureCode,
      legalBasisCode: legalInput.legalBasisCode,
      authorityActor: actorRole,
      fileVersionIds: versions.map((item) => item.id),
      fileIds: versions.map((item) => item.fileAssetId)
    }
  });
}

async function ensureIntakeFeeObligation(registrationId: string, actorId: string) {
  const existing = await prisma.paymentObligation.findFirst({
    where: { registrationId, type: PaymentObligationType.INTAKE_FEE }
  });
  if (existing) return;
  await prisma.paymentObligation.create({
    data: {
      registrationId,
      type: PaymentObligationType.INTAKE_FEE,
      createdBy: actorId,
      note: "Thu tại cơ quan tiếp nhận theo thủ tục pháp lý"
    }
  });
}

function toNotificationMessage(status: RegistrationStatus, note: string) {
  return `Hồ sơ đã được cập nhật sang trạng thái ${status}: ${note}`;
}

function assertTransitionAllowed(currentStatus: RegistrationStatus, nextStatus: RegistrationStatus, actorRole: UserRole) {
  const allowedNext = STATUS_TRANSITION_GRAPH[currentStatus] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    throw badRequestError(`Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`);
  }
  if (actorRole === "ADMIN") return;

  const allowedByRole = ROLE_ALLOWED_TARGET_STATUS[actorRole] ?? [];
  if (!allowedByRole.includes(nextStatus)) {
    throw forbiddenError(`Vai trò ${actorRole} không được phép chuyển sang trạng thái ${nextStatus}`);
  }
}

async function ensureProcedureAndAuthority(
  registration: { procedureCode: string | null },
  actorRole: UserRole
) {
  if (!registration.procedureCode) {
    throw badRequestError("Hồ sơ chưa gắn procedureCode hợp lệ");
  }

  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode: registration.procedureCode }
  });
  if (!procedure || !procedure.isActive) {
    throw badRequestError("Thủ tục pháp lý không tồn tại hoặc không còn hiệu lực");
  }

  if (actorRole === "ADMIN" || isCitizenRole(actorRole)) return procedure;
  const allowedActors = readAuthorityActors(procedure.authorityActors);
  if (!allowedActors.includes(actorRole)) {
    throw forbiddenError(`Vai trò ${actorRole} không thuộc authority matrix của thủ tục ${procedure.procedureCode}`);
  }
  return procedure;
}

async function writeRegistrationNotificationLog(
  registrationId: string,
  actor: AuthenticatedRequest["user"],
  status: RegistrationStatus,
  note: string
) {
  await writeAuditLog({
    actorId: actor.userId,
    action: "REGISTRATION_NOTIFICATION_SENT",
    entityType: "REGISTRATION",
    entityId: registrationId,
    payload: {
      status,
      note,
      message: toNotificationMessage(status, note)
    }
  });
}

function generateRegistrationCode() {
  const now = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `REG-${new Date().getFullYear()}-${now}-${randomSuffix}`;
}

function toLegalPayload(legalInput: LegalTransitionInput) {
  return {
    procedureCode: legalInput.procedureCode,
    legalBasisCode: legalInput.legalBasisCode,
    reason: legalInput.reason,
    evidenceIds: legalInput.evidenceIds
  };
}

function toRegistrationItem(item: {
  id: string;
  code: string;
  applicantId: string;
  provinceCode: string;
  communeName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: Prisma.Decimal;
  landUsePurpose: string;
  address: string;
  ownerType: string;
  ownerFullName: string;
  ownerIdentityNumber: string | null;
  ownerAddress: string | null;
  procedureCode: string | null;
  legalBasisCode: string | null;
  submitSnapshotAt?: Date | null;
  status: RegistrationStatus;
  noteHistory: Prisma.JsonValue | null;
  procedureCode: string | null;
  legalBasisCode: string | null;
  submittedSnapshotLocked: boolean;
  cadastralUpdatedAt: Date | null;
  landCode: string | null;
  tokenId: number | null;
  txHash: string | null;
  ipfsCid: string | null;
  documentHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  files?: Array<{
    id: string;
    documentType: string;
    storageStatus: string;
    originalName: string;
    cid: string | null;
    hash: string | null;
  }>;
  documentVersions?: Array<{
    id: string;
    fileAssetId: string;
    documentType: string;
    versionNo: number;
    createdAt: Date;
  }>;
  submitSnapshots?: Array<{
    id: string;
    procedureCode: string | null;
    legalBasisCode: string | null;
    createdAt: Date;
  }>;
  paymentObligations?: Array<{
    id: string;
    type: PaymentObligationType;
    status: string;
    amount: Prisma.Decimal | null;
    referenceNo: string | null;
    fulfilledAt: Date | null;
    updatedAt: Date;
  }>;
}) {
  const notes = parseNoteHistory(item.noteHistory);
  return {
    id: item.id,
    code: item.code,
    applicantId: item.applicantId,
    status: item.status,
    procedureCode: item.procedureCode,
    legalBasisCode: item.legalBasisCode,
    submittedSnapshotLocked: item.submittedSnapshotLocked,
    cadastralUpdatedAt: item.cadastralUpdatedAt,
    landCode: item.landCode,
    tokenId: item.tokenId,
    txHash: item.txHash,
    ipfsCid: item.ipfsCid,
    documentHash: item.documentHash,
    landInfo: {
      provinceCode: item.provinceCode,
      communeName: item.communeName,
      parcelNumber: item.parcelNumber,
      mapSheetNumber: item.mapSheetNumber,
      area: Number(item.area),
      landUsePurpose: item.landUsePurpose,
      address: item.address
    },
    ownerInfo: {
      ownerType: item.ownerType,
      fullName: item.ownerFullName,
      identityNumber: item.ownerIdentityNumber,
      address: item.ownerAddress
    },
    procedureCode: item.procedureCode,
    legalBasisCode: item.legalBasisCode,
    submitSnapshotAt: item.submitSnapshotAt,
    notes,
    files:
      item.files?.map((file) => ({
        id: file.id,
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        originalName: file.originalName,
        cid: file.cid,
        hash: file.hash
      })) ?? [],
    documentVersions:
      item.documentVersions?.map((version) => ({
        id: version.id,
        fileAssetId: version.fileAssetId,
        documentType: version.documentType,
        versionNo: version.versionNo,
        createdAt: version.createdAt
      })) ?? [],
    submitSnapshots:
      item.submitSnapshots?.map((snapshot) => ({
        id: snapshot.id,
        procedureCode: snapshot.procedureCode,
        legalBasisCode: snapshot.legalBasisCode,
        createdAt: snapshot.createdAt
      })) ?? [],
    paymentObligations:
      item.paymentObligations?.map((obligation) => ({
        id: obligation.id,
        type: obligation.type,
        status: obligation.status,
        amount: obligation.amount ? Number(obligation.amount) : null,
        referenceNo: obligation.referenceNo,
        fulfilledAt: obligation.fulfilledAt,
        updatedAt: obligation.updatedAt
      })) ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function findRegistrationByParam(input: string) {
  return prisma.registration.findFirst({
    where: {
      OR: [{ id: input }, { code: input }]
    },
    include: {
      files: true,
      documentVersions: {
        orderBy: [{ createdAt: "desc" }, { versionNo: "desc" }]
      },
      submitSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 20
      },
      paymentObligations: {
        orderBy: { updatedAt: "desc" }
      }
    }
  });
}

async function updateStatus(
  registrationId: string,
  status: RegistrationStatus,
  note: string,
  actor: AuthenticatedRequest["user"],
  payload: Record<string, unknown> = {},
  dataPatch: Prisma.RegistrationUncheckedUpdateInput = {}
) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { procedure: true }
  });
  if (!registration) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  assertTransitionAllowed(registration.status, status, actor.role);
  await ensureProcedureAndAuthority(registration, actor.role);

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status,
      noteHistory: appendNoteHistory(registration.noteHistory, note),
      ...(dataPatch as Prisma.RegistrationUncheckedUpdateInput)
    },
    include: { files: true }
  });

  await writeAuditLog({
    actorId: actor.userId,
    action: "REGISTRATION_STATUS_UPDATED",
    entityType: "REGISTRATION",
    entityId: updated.id,
    payload: {
      previousStatus: registration.status,
      status,
      legalBasisCode,
      note,
      ...payload
    }
  });

  await writeRegistrationNotificationLog(updated.id, actor, status, note);
  return updated;
}

export const registrationRouter = Router();

registrationRouter.use(requireAuth);

registrationRouter.get(
  "/",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const { page, pageSize, status, keyword, procedureCode } = parsed.data;
    const where: Prisma.RegistrationWhereInput = {
      ...(status ? { status } : {}),
      ...(procedureCode ? { procedureCode } : {}),
      ...(isCitizenRole(user.role) ? { applicantId: user.userId } : {}),
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword } },
              { ownerFullName: { contains: keyword } },
              { parcelNumber: { contains: keyword } },
              { mapSheetNumber: { contains: keyword } },
              { address: { contains: keyword } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: { files: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.registration.count({ where })
    ]);

    return ok(res, { items: items.map((item) => toRegistrationItem(item)), total });
  })
);

registrationRouter.post(
  "/",
  requireRoles(AUTH_ROLES.citizen),
  asyncHandler(async (req, res) => {
    const parsed = createRegistrationSchema.safeParse(req.body);
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const procedureCode = parsed.data.procedureCode.trim().toUpperCase();
    const procedure = await prisma.legalProcedure.findUnique({ where: { procedureCode } });
    if (!procedure || !procedure.isActive) {
      throw badRequestError("procedureCode không hợp lệ hoặc đã ngừng áp dụng");
    }

    const inputFileIds = parsed.data.attachedFileIds ?? parsed.data.fileIds ?? [];
    const attachableFileIds = await ensureAttachableFileIdsForApplicant(inputFileIds, user.userId);
    const code = generateRegistrationCode();
    const initialNote = "Hồ sơ được khởi tạo trên hệ thống";
    const defaultProcedureCode = parsed.data.procedureCode ?? process.env.LEGAL_DEFAULT_PROCEDURE_CODE ?? "1.013978";
    const defaultLegalBasisCode =
      parsed.data.legalBasisCode ?? process.env.LEGAL_DEFAULT_BASIS_CODE ?? "151/2025-ND-CP|3380/QD-BNNMT";

    const record = await prisma.registration.create({
      data: {
        code,
        applicantId: user.userId,
        provinceCode: parsed.data.landInfo.provinceCode,
        communeName: parsed.data.landInfo.communeName,
        parcelNumber: parsed.data.landInfo.parcelNumber,
        mapSheetNumber: parsed.data.landInfo.mapSheetNumber,
        area: new Prisma.Decimal(parsed.data.landInfo.area),
        landUsePurpose: parsed.data.landInfo.landUsePurpose,
        address: parsed.data.landInfo.address,
        ownerType: parsed.data.ownerInfo.ownerType,
        ownerFullName: parsed.data.ownerInfo.fullName,
        ownerIdentityNumber: parsed.data.ownerInfo.identityNumber,
        ownerAddress: parsed.data.ownerInfo.address,
        procedureCode: defaultProcedureCode,
        legalBasisCode: defaultLegalBasisCode,
        noteHistory: [initialNote],
        files:
          attachableFileIds.length > 0
            ? {
                connect: attachableFileIds.map((id) => ({ id }))
              }
            : undefined
      },
      include: { files: true }
    });

    for (const file of record.files) {
      await createDocumentVersion(record.id, {
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        cid: file.cid,
        hash: file.hash,
        fileAssetId: file.id,
        createdById: user.userId,
        note: "Phiên bản tài liệu khởi tạo theo danh sách đính kèm"
      });
    }

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_CREATED",
      entityType: "REGISTRATION",
      entityId: record.id,
      payload: {
        registrationCode: record.code,
        procedureCode: record.procedureCode,
        provinceCode: record.provinceCode,
        communeName: record.communeName
      }
    });

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
  })
);

registrationRouter.get(
  "/:id",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    await ensureRegistrationReadable(record, user);
    return ok(res, toRegistrationItem(record));
  })
);

registrationRouter.get(
  "/:id/notifications",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(record, user, "Bạn không có quyền xem thông báo của hồ sơ này");

    const notificationLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "REGISTRATION",
        entityId: record.id,
        action: "REGISTRATION_NOTIFICATION_SENT"
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const items = notificationLogs.map((entry) => {
      const payload = readJsonObject(entry.payload);
      return {
        id: entry.id,
        status: typeof payload.status === "string" ? payload.status : null,
        note: typeof payload.note === "string" ? payload.note : null,
        message: typeof payload.message === "string" ? payload.message : "Thông báo cập nhật hồ sơ",
        createdAt: entry.createdAt
      };
    });

    return ok(res, { items, total: items.length });
  })
);

registrationRouter.get(
  "/:id/document-versions",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(record, user);

    const items = await prisma.registrationDocumentVersion.findMany({
      where: { registrationId: record.id },
      orderBy: [{ versionNumber: "desc" }]
    });
    return ok(res, { items: items.map((item) => toDocumentVersionItem(item)), total: items.length });
  })
);

registrationRouter.post(
  "/:id/document-versions",
  requireRoles([...AUTH_ROLES.citizen, "RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = createDocumentVersionSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(record, user, "Bạn không có quyền cập nhật tài liệu hồ sơ này");

    let fileRef: {
      id: string;
      documentType: string;
      storageStatus: string;
      cid: string | null;
      hash: string | null;
    } | null = null;
    if (parsed.data.fileAssetId) {
      const file = await prisma.fileAsset.findUnique({ where: { id: parsed.data.fileAssetId } });
      if (!file || file.registrationId !== record.id) {
        throw badRequestError("fileAssetId không thuộc hồ sơ đăng ký");
      }
      fileRef = file;
    }

    await prisma.registrationDocumentVersion.updateMany({
      where: {
        registrationId: record.id,
        documentType: parsed.data.documentType,
        status: "ACTIVE"
      },
      data: {
        status: "REPLACED",
        updatedAt: new Date()
      }
    });

    const createdVersion = await createDocumentVersion(record.id, {
      documentType: parsed.data.documentType,
      storageStatus: parsed.data.storageStatus,
      cid: parsed.data.cid ?? fileRef?.cid ?? null,
      hash: parsed.data.hash ?? fileRef?.hash ?? null,
      note: parsed.data.note,
      fileAssetId: parsed.data.fileAssetId ?? null,
      createdById: user.userId
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_DOCUMENT_VERSION_CREATED",
      entityType: "REGISTRATION",
      entityId: record.id,
      payload: {
        versionId: createdVersion.id,
        versionNumber: createdVersion.versionNumber,
        documentType: createdVersion.documentType
      }
    });

    return created(res, toDocumentVersionItem(createdVersion), "Đã tạo phiên bản tài liệu mới");
  })
);

registrationRouter.get(
  "/:id/snapshots",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(record, user);

    const items = await prisma.registrationSubmitSnapshot.findMany({
      where: { registrationId: record.id },
      orderBy: { snapshotNo: "desc" }
    });
    return ok(res, { items, total: items.length });
  })
);

registrationRouter.get(
  "/:id/document-history",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const record = await findRegistrationByParam(String(req.params.id));
    if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(record, user);

    const [versions, snapshots, statusLogs] = await Promise.all([
      prisma.registrationDocumentVersion.findMany({
        where: { registrationId: record.id },
        orderBy: { createdAt: "desc" }
      }),
      prisma.registrationSubmitSnapshot.findMany({
        where: { registrationId: record.id },
        orderBy: { createdAt: "desc" }
      }),
      prisma.auditLog.findMany({
        where: {
          entityType: "REGISTRATION",
          entityId: record.id,
          action: { in: ["REGISTRATION_STATUS_UPDATED", "REGISTRATION_APPROVED", "REGISTRATION_BLOCKCHAIN_SYNCED"] }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const versionEvents = versions.map((item) => ({
      id: item.id,
      type: "DOCUMENT_VERSION",
      at: item.createdAt,
      title: `Phiên bản tài liệu #${item.versionNumber}`,
      detail: {
        status: item.status,
        documentType: item.documentType,
        cid: item.cid,
        hash: item.hash
      }
    }));

    const snapshotEvents = snapshots.map((item) => ({
      id: item.id,
      type: "SUBMIT_SNAPSHOT",
      at: item.createdAt,
      title: `Snapshot nộp hồ sơ #${item.snapshotNo}`,
      detail: {
        legalBasisCode: item.legalBasisCode,
        authorityActor: item.authorityActor,
        documentVersionIds: item.documentVersionIds
      }
    }));

    const statusEvents = statusLogs.map((item) => ({
      id: item.id,
      type: "STATUS_AUDIT",
      at: item.createdAt,
      title: `Cập nhật xử lý: ${item.action}`,
      detail: item.payload ?? {}
    }));

    const items = [...versionEvents, ...snapshotEvents, ...statusEvents].sort(
      (a, b) => b.at.getTime() - a.at.getTime()
    );

    return ok(res, { items, total: items.length });
  })
);

registrationRouter.post(
  "/:id/submit",
  requireRoles(AUTH_ROLES.citizen),
  asyncHandler(async (req, res) => {
    const parsed = submitSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    if (existing.applicantId !== user.userId) throw forbiddenError("Bạn không có quyền nộp hồ sơ này");
    ensureActionAllowedByStatus("submit", existing.status);

    const procedureCode = parsed.data.procedureCode ?? existing.procedureCode ?? process.env.LEGAL_DEFAULT_PROCEDURE_CODE ?? "1.013978";
    const legalBasisCode =
      parsed.data.legalBasisCode ?? existing.legalBasisCode ?? process.env.LEGAL_DEFAULT_BASIS_CODE ?? "151/2025-ND-CP|3380/QD-BNNMT";

    await ensureDocumentVersions(existing.id, user.userId);
    await createSubmitSnapshot(existing.id, user.userId, user.role, { procedureCode, legalBasisCode });
    await ensureIntakeFeeObligation(existing.id, user.userId);

    const updated = await updateStatus(
      existing.id,
      "CHO_TIEP_NHAN",
      parsed.data.note ?? "Người dân đã nộp hồ sơ vào luồng tiếp nhận",
      user,
      {
        procedureCode,
        legalBasisCode
      },
      {
        submitSnapshotAt: new Date()
      }
    );

    await prisma.registration.update({
      where: { id: existing.id },
      data: { submittedSnapshotLocked: true, legalBasisCode: parsed.data.legalBasisCode }
    });

    return ok(res, toRegistrationItem(updated), "Đã chuyển hồ sơ sang trạng thái chờ tiếp nhận");
  })
);

registrationRouter.patch(
  "/:id/status",
  requireRoles(["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = patchStatusSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureStatusTransitionAllowed(existing.status, parsed.data.status);
    await ensureLegalTransitionAllowed(existing, user.role, {
      procedureCode: parsed.data.procedureCode,
      legalBasisCode: parsed.data.legalBasisCode,
      reason: parsed.data.reason ?? `Cập nhật trạng thái hồ sơ sang ${parsed.data.status} bởi ${user.role}`,
      evidenceIds: parsed.data.evidenceIds
    });

    const note =
      parsed.data.reason ??
      `Cập nhật trạng thái hồ sơ sang ${parsed.data.status} bởi ${user.role}`;

    const updated = await updateStatus(
      existing.id,
      parsed.data.status,
      note,
      user,
      {
        ...toLegalPayload({
          procedureCode: parsed.data.procedureCode,
          legalBasisCode: parsed.data.legalBasisCode,
          reason: note,
          evidenceIds: parsed.data.evidenceIds
        })
      },
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );
    return ok(res, toRegistrationItem(updated), "Đã cập nhật trạng thái hồ sơ");
  })
);

registrationRouter.post(
  "/:id/commune-confirm",
  requireRoles(["COMMUNE_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = communeConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("communeConfirm", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);

    const nextStatus: RegistrationStatus = parsed.data.confirmed ? "DA_XAC_NHAN_CAP_XA" : "CAN_BO_SUNG";
    ensureStatusTransitionAllowed(existing.status, nextStatus);
    const note =
      parsed.data.notes ??
      (parsed.data.confirmed
        ? "UBND cấp xã đã xác nhận thông tin hồ sơ"
        : "UBND cấp xã yêu cầu bổ sung thông tin hồ sơ");
    const legalReason = parsed.data.reason || note;

    const updated = await updateStatus(existing.id, nextStatus, note, user, {
      confirmed: parsed.data.confirmed,
      ...toLegalPayload({
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode,
        reason: legalReason,
        evidenceIds: parsed.data.evidenceIds
      })
    }, {
      procedureCode: parsed.data.procedureCode,
      legalBasisCode: parsed.data.legalBasisCode
    });
    return ok(res, toRegistrationItem(updated), "Đã cập nhật kết quả xác nhận cấp xã");
  })
);

registrationRouter.post(
  "/:id/tax-transfer",
  requireRoles(["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = taxTransferSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("taxTransfer", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "CHO_THUE");

    const existingFinancialObligation = await prisma.paymentObligation.findFirst({
      where: {
        registrationId: existing.id,
        type: PaymentObligationType.LAND_FINANCIAL_OBLIGATION
      },
      select: { id: true }
    });
    if (existingFinancialObligation) {
      await prisma.paymentObligation.update({
        where: { id: existingFinancialObligation.id },
        data: {
          referenceNo: parsed.data.taxReferenceNo,
          note: parsed.data.notes ?? parsed.data.reason
        }
      });
    } else {
      await prisma.paymentObligation.create({
        data: {
          registrationId: existing.id,
          type: PaymentObligationType.LAND_FINANCIAL_OBLIGATION,
          referenceNo: parsed.data.taxReferenceNo,
          createdBy: user.userId,
          note: parsed.data.notes ?? parsed.data.reason
        }
      });
    }

    await prisma.registrationPaymentObligation.create({
      data: {
        registrationId: existing.id,
        type: "LAND_FINANCIAL_OBLIGATION",
        status: "PENDING",
        legalBasisCode: parsed.data.legalBasisCode,
        referenceNo: parsed.data.taxReferenceNo,
        amount: parsed.data.amount ? new Prisma.Decimal(parsed.data.amount) : null,
        note: parsed.data.notes ?? "Đã chuyển thông tin xác định nghĩa vụ tài chính",
        createdById: user.userId
      }
    });

    const updated = await updateStatus(
      existing.id,
      "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
      parsed.data.notes ?? "Đã chuyển thông tin xác định nghĩa vụ tài chính sang cơ quan thuế",
      user,
      {
        taxReferenceNo: parsed.data.taxReferenceNo,
        ...toLegalPayload({
          procedureCode: parsed.data.procedureCode,
          legalBasisCode: parsed.data.legalBasisCode,
          reason: parsed.data.reason,
          evidenceIds: parsed.data.evidenceIds
        })
      },
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );

    return ok(res, toRegistrationItem(updated), "Đã chuyển thông tin nghĩa vụ tài chính");
  })
);

registrationRouter.post(
  "/:id/approve",
  requireRoles(["APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = approveSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("approve", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "DA_KY_CAP");
    const landCode = parsed.data.landCode ?? existing.landCode ?? `LAND-${existing.code}`;

    const updatedStatus = await updateStatus(
      existing.id,
      "DA_KY_CAP",
      parsed.data.note ?? "Hồ sơ đã được phê duyệt/ký cấp",
      user,
      parsed.data.legalBasisCode,
      {
        approvalNumber: parsed.data.approvalNumber ?? null,
        approvalDate: parsed.data.approvalDate ?? null
      }
    );

    const updated = await prisma.registration.update({
      where: { id: updatedStatus.id },
      data: {
        status: "DA_KY_CAP",
        landCode,
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode,
        noteHistory: appendNoteHistory(existing.noteHistory, parsed.data.note ?? "Hồ sơ đã được phê duyệt/ký cấp")
      } as Prisma.RegistrationUncheckedUpdateInput,
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_APPROVED",
      entityType: "REGISTRATION",
      entityId: updated.id,
      payload: {
        approvalNumber: parsed.data.approvalNumber ?? null,
        approvalDate: parsed.data.approvalDate ?? null,
        landCode: updated.landCode,
        ...toLegalPayload({
          procedureCode: parsed.data.procedureCode,
          legalBasisCode: parsed.data.legalBasisCode,
          reason: parsed.data.reason,
          evidenceIds: parsed.data.evidenceIds
        })
      }
    });
    await writeRegistrationNotificationLog(
      updated.id,
      user,
      "DA_KY_CAP",
      parsed.data.note ?? "Hồ sơ đã được phê duyệt/ký cấp"
    );

    return ok(res, toRegistrationItem(updated), "Đã phê duyệt hồ sơ đăng ký");
  })
);

registrationRouter.post(
  "/:id/cadastral-update",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = cadastralUpdateSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("cadastralUpdate", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "DA_CAP_NHAT_HO_SO_DIA_CHINH");

    const updated = await updateStatus(
      existing.id,
      "DA_CAP_NHAT_HO_SO_DIA_CHINH",
      "Đã cập nhật hồ sơ địa chính/CSDL đất đai",
      user,
      toLegalPayload(parsed.data),
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );

    return ok(res, toRegistrationItem(updated), "Đã cập nhật hồ sơ địa chính");
  })
);

registrationRouter.post(
  "/:id/blockchain-sync",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = blockchainSyncSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("blockchainSync", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "DA_GHI_BLOCKCHAIN");
    const normalizedHash = toChainSafeHash(parsed.data.metadataHash);

    const landCode = existing.landCode ?? `LAND-${existing.code}`;
    const chainResult =
      existing.tokenId === null
        ? await registerLandOnChain({
            registrationCode: existing.code,
            landCode,
            provinceCode: existing.provinceCode,
            communeName: existing.communeName,
            mapSheetNumber: existing.mapSheetNumber,
            parcelNumber: existing.parcelNumber,
            ownerType: existing.ownerType,
            ownerFullName: existing.ownerFullName,
            ownerIdentityNumber: existing.ownerIdentityNumber,
            documentCid: parsed.data.cid,
            documentHash: normalizedHash,
            metadataUri: `ipfs://${parsed.data.cid}`
          })
        : null;

    const syncResult =
      existing.tokenId !== null
        ? await syncLandMetadataOnChain(existing.tokenId, parsed.data.cid, normalizedHash, `ipfs://${parsed.data.cid}`)
        : { txHash: chainResult?.txHash ?? existing.txHash ?? `0x${Date.now().toString(16)}nosync`, mode: chainResult?.mode ?? ("mock" as const) };

    const updated = await prisma.registration.update({
      where: { id: existing.id },
      data: {
        status: "DA_GHI_BLOCKCHAIN",
        landCode,
        tokenId: chainResult?.tokenId ?? existing.tokenId,
        ipfsCid: parsed.data.cid,
        documentHash: normalizedHash,
        txHash: syncResult.txHash,
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode,
        noteHistory: appendNoteHistory(existing.noteHistory, "Đã đồng bộ metadata hồ sơ lên blockchain")
      } as Prisma.RegistrationUncheckedUpdateInput,
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_BLOCKCHAIN_SYNCED",
      entityType: "REGISTRATION",
      entityId: updated.id,
      payload: {
        cid: parsed.data.cid,
        metadataHash: normalizedHash,
        txHash: updated.txHash,
        tokenId: updated.tokenId,
        blockchainMode: syncResult.mode,
        ...toLegalPayload(parsed.data)
      }
    });
    await writeRegistrationNotificationLog(updated.id, user, updated.status, "Đã đồng bộ metadata hồ sơ lên blockchain");

    return ok(
      res,
      {
        registrationId: updated.id,
        tokenId: updated.tokenId,
        txHash: updated.txHash,
        chainId: expectedChainId,
        contractAddress: onChainLookup.contractAddress,
        cid: updated.ipfsCid,
        metadataHash: updated.documentHash
      },
      "Đã đồng bộ bản ghi số"
    );
  })
);

registrationRouter.post(
  "/:id/request-supplement",
  requireRoles(["RECEPTION_OFFICER", "COMMUNE_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = supplementRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("requestSupplement", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "CAN_BO_SUNG");

    const updated = await updateStatus(
      existing.id,
      "CAN_BO_SUNG",
      parsed.data.note,
      user,
      toLegalPayload(parsed.data),
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );
    return ok(res, toRegistrationItem(updated), "Đã cập nhật yêu cầu bổ sung hồ sơ");
  })
);

registrationRouter.get(
  "/:id/blockchain-status",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN", "AUDITOR"]),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const effectiveLandCode = existing.landCode ?? `LAND-${existing.code}`;
    const onChain = await lookupRegistrationOnChain(existing.code, effectiveLandCode);
    const offChainLinked = Boolean(existing.txHash || existing.tokenId);
    const onChainLinked = Boolean(onChain.registrationTokenId || onChain.landTokenId);
    const inSync = offChainLinked === onChainLinked;

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_BLOCKCHAIN_STATUS_CHECKED",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: {
        registrationCode: existing.code,
        landCode: effectiveLandCode,
        offChainLinked,
        onChainLinked,
        inSync
      }
    });

    return ok(
      res,
      {
        registrationId: existing.id,
        registrationCode: existing.code,
        landCode: effectiveLandCode,
        offChain: {
          status: existing.status,
          tokenId: existing.tokenId,
          txHash: existing.txHash
        },
        onChain,
        inSync
      },
      "Đã đối soát trạng thái on-chain/off-chain"
    );
  })
);

registrationRouter.get(
  "/:id/tx-lifecycle",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN", "AUDITOR"]),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const items = await prisma.blockchainTxLifecycle.findMany({
      where: { registrationId: existing.id },
      orderBy: { createdAt: "desc" }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_BLOCKCHAIN_TX_LIFECYCLE_VIEWED",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: { total: items.length }
    });

    return ok(
      res,
      {
        items: items.map((item) => ({
          id: item.id,
          action: item.action,
          network: item.network,
          chainId: item.chainId,
          walletAddress: item.walletAddress,
          txHash: item.txHash,
          explorerUrl: item.explorerUrl,
          status: item.status,
          errorCode: item.errorCode,
          errorMessage: item.errorMessage,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })),
        total: items.length
      },
      "Đã tải vòng đời giao dịch blockchain"
    );
  })
);

registrationRouter.post(
  "/:id/accept",
  requireRoles(["RECEPTION_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = legalTransitionSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("accept", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "DA_TIEP_NHAN");

    const updated = await updateStatus(
      existing.id,
      "DA_TIEP_NHAN",
      parsed.data.reason || "Bộ phận một cửa đã tiếp nhận hồ sơ",
      user,
      toLegalPayload(parsed.data),
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );
    return ok(res, toRegistrationItem(updated), "Đã tiếp nhận hồ sơ hợp lệ");
  })
);

registrationRouter.post(
  "/:id/reject",
  requireRoles(["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = requiredNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    ensureActionAllowedByStatus("reject", existing.status);
    await ensureLegalTransitionAllowed(existing, user.role, parsed.data);
    ensureStatusTransitionAllowed(existing.status, "TU_CHOI");

    const updated = await updateStatus(
      existing.id,
      "TU_CHOI",
      parsed.data.note,
      user,
      toLegalPayload(parsed.data),
      {
        procedureCode: parsed.data.procedureCode,
        legalBasisCode: parsed.data.legalBasisCode
      }
    );
    return ok(res, toRegistrationItem(updated), "Đã từ chối hồ sơ");
  })
);

registrationRouter.get(
  "/:id/payment-obligations",
  requireRoles(allAuthenticatedRoles),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureRegistrationReadable(existing, user);

    const items = await prisma.registrationPaymentObligation.findMany({
      where: { registrationId: existing.id },
      orderBy: { createdAt: "desc" }
    });
    return ok(res, { items: items.map((item) => toPaymentObligationItem(item)), total: items.length });
  })
);

registrationRouter.post(
  "/:id/payment-obligations",
  requireRoles(["RECEPTION_OFFICER", "LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = createPaymentObligationSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureProcedureAndAuthority(existing, user.role);

    if (parsed.data.type === "LAND_FINANCIAL_OBLIGATION" && !["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"].includes(user.role)) {
      throw forbiddenError("Vai trò hiện tại không được tạo nghĩa vụ tài chính đất đai");
    }

    const obligation = await prisma.registrationPaymentObligation.create({
      data: {
        registrationId: existing.id,
        type: parsed.data.type,
        legalBasisCode: parsed.data.legalBasisCode,
        referenceNo: parsed.data.referenceNo,
        amount: parsed.data.amount ? new Prisma.Decimal(parsed.data.amount) : null,
        note: parsed.data.note ?? null,
        createdById: user.userId
      }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_PAYMENT_OBLIGATION_CREATED",
      entityType: "REGISTRATION_PAYMENT_OBLIGATION",
      entityId: obligation.id,
      payload: {
        registrationId: existing.id,
        type: obligation.type,
        legalBasisCode: obligation.legalBasisCode
      }
    });

    return created(res, toPaymentObligationItem(obligation), "Đã tạo nghĩa vụ tài chính");
  })
);

registrationRouter.patch(
  "/:id/payment-obligations/:obligationId/status",
  requireRoles(["TAX_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = updatePaymentObligationSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    await ensureProcedureAndAuthority(existing, user.role);

    const obligation = await prisma.registrationPaymentObligation.findFirst({
      where: { id: String(req.params.obligationId), registrationId: existing.id }
    });
    if (!obligation) throw notFoundError("Không tìm thấy nghĩa vụ tài chính");

    const updatedObligation = await prisma.registrationPaymentObligation.update({
      where: { id: obligation.id },
      data: {
        status: parsed.data.status,
        legalBasisCode: parsed.data.legalBasisCode,
        note: parsed.data.note ?? obligation.note,
        ...(parsed.data.status === "CONFIRMED"
          ? { confirmedById: user.userId, confirmedAt: new Date() }
          : {})
      }
    });

    if (parsed.data.status === "CONFIRMED" && existing.status === "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH") {
      await updateStatus(
        existing.id,
        "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
        parsed.data.note ?? "Đã hoàn thành nghĩa vụ tài chính",
        user,
        parsed.data.legalBasisCode
      );
    }

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_PAYMENT_OBLIGATION_UPDATED",
      entityType: "REGISTRATION_PAYMENT_OBLIGATION",
      entityId: updatedObligation.id,
      payload: {
        registrationId: existing.id,
        previousStatus: obligation.status,
        status: updatedObligation.status,
        legalBasisCode: parsed.data.legalBasisCode
      }
    });

    return ok(res, toPaymentObligationItem(updatedObligation), "Đã cập nhật nghĩa vụ tài chính");
  })
);
