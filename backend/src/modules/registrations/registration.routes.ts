import {
  BlockchainNetwork,
  BlockchainTxLifecycleStatus,
  DocumentVersionStatus,
  PaymentObligationStatus,
  PaymentObligationType,
  Prisma,
  RegistrationStatus,
  UserRole
} from "@prisma/client";
import { Router } from "express";
import { ethers } from "ethers";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { asyncHandler, badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { lookupRegistrationOnChain, mintRegistrationRecord } from "../../lib/blockchain/urban-land-registry.client.js";
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
  procedureCode: z.string().min(3).max(64),
  legalBasisCode: legalBasisCodeSchema.optional(),
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
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

const patchStatusSchema = z
  .object({
    status: registrationStatusSchema,
    legalBasisCode: legalBasisCodeSchema,
    reason: z.string().min(3).optional()
  })
  .superRefine((value, ctx) => {
    if ((value.status === "CAN_BO_SUNG" || value.status === "TU_CHOI") && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason is required for supplement/reject status"
      });
    }
  });

const communeConfirmSchema = z.object({
  confirmed: z.boolean(),
  legalBasisCode: legalBasisCodeSchema,
  notes: z.string().min(3),
  evidenceFileId: z.string().min(3)
});

const taxTransferSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  taxReferenceNo: z.string().min(3),
  amount: z.coerce.number().positive().optional(),
  notes: z.string().min(3).optional()
});

const approveSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  approvalNumber: z.string().min(3).optional(),
  approvalDate: z.string().optional(),
  note: z.string().min(3).optional(),
  landCode: z.string().optional()
});

const cadastralUpdateSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3).optional()
});

const blockchainSyncSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  cid: z.string().min(3),
  metadataHash: z.string().min(3),
  walletAuthorizationId: z.string().min(1),
  signerWalletAddress: z.string().min(1),
  signerChainId: z.coerce.number().int().positive(),
  signingMessage: z.string().min(3),
  signature: z.string().min(20)
});

const requiredNoteSchema = z.object({
  legalBasisCode: legalBasisCodeSchema,
  note: z.string().min(3)
});

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
const statusMutationRoles = [
  "RECEPTION_OFFICER",
  "COMMUNE_OFFICER",
  "LAND_REGISTRY_OFFICER",
  "APPROVAL_AUTHORITY",
  "TAX_OFFICER",
  "ADMIN"
] as const;

const ROLE_ALLOWED_TARGET_STATUS: Record<UserRole, RegistrationStatus[]> = {
  CITIZEN: ["CHO_TIEP_NHAN"],
  BUSINESS: ["CHO_TIEP_NHAN"],
  RECEPTION_OFFICER: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "CHO_XAC_NHAN_CAP_XA"],
  COMMUNE_OFFICER: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  LAND_REGISTRY_OFFICER: [
    "DANG_THAM_DINH_VPDKDD",
    "CHO_THUE",
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    "CHO_KY_CAP",
    "DA_CAP_NHAT_HO_SO_DIA_CHINH",
    "CAN_BO_SUNG",
    "TU_CHOI"
  ],
  APPROVAL_AUTHORITY: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  TAX_OFFICER: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  AUDITOR: [],
  ADMIN: [
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
    "DA_TRA_KET_QUA",
    "HUY_HO_SO",
    "TU_CHOI"
  ]
};

const STATUS_TRANSITION_GRAPH: Partial<Record<RegistrationStatus, RegistrationStatus[]>> = {
  MOI_TAO: ["CHO_TIEP_NHAN"],
  CHO_TIEP_NHAN: ["DA_TIEP_NHAN", "CAN_BO_SUNG", "TU_CHOI"],
  DA_TIEP_NHAN: ["CHO_XAC_NHAN_CAP_XA", "DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  CHO_XAC_NHAN_CAP_XA: ["DA_XAC_NHAN_CAP_XA", "CAN_BO_SUNG"],
  DA_XAC_NHAN_CAP_XA: ["DANG_THAM_DINH_VPDKDD", "CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  DANG_THAM_DINH_VPDKDD: ["CHO_THUE", "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CHO_KY_CAP", "CAN_BO_SUNG", "TU_CHOI"],
  CHO_THUE: ["CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH"],
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["DA_HOAN_THANH_NGHIA_VU_TAI_CHINH", "CAN_BO_SUNG"],
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: ["CHO_KY_CAP"],
  CHO_KY_CAP: ["DA_KY_CAP", "TU_CHOI", "DA_CAP"],
  DA_KY_CAP: ["DA_CAP_NHAT_HO_SO_DIA_CHINH", "DA_CAP"],
  DA_CAP_NHAT_HO_SO_DIA_CHINH: ["DA_GHI_BLOCKCHAIN", "DA_CAP", "DA_TRA_KET_QUA"],
  DA_CAP: ["DA_GHI_BLOCKCHAIN", "DA_TRA_KET_QUA"],
  DA_GHI_BLOCKCHAIN: ["DA_TRA_KET_QUA"]
};

function isCitizenRole(role: string) {
  return AUTH_ROLES.citizen.includes(role as (typeof AUTH_ROLES.citizen)[number]);
}

function resolveExpectedBlockchainNetwork() {
  const networkRaw = (process.env.BLOCKCHAIN_NETWORK ?? "SEPOLIA").trim().toUpperCase();
  return (Object.values(BlockchainNetwork) as string[]).includes(networkRaw)
    ? (networkRaw as BlockchainNetwork)
    : BlockchainNetwork.SEPOLIA;
}

function resolveExpectedBlockchainChainId() {
  const parsed = Number(process.env.BLOCKCHAIN_CHAIN_ID ?? "11155111");
  if (!Number.isFinite(parsed) || parsed <= 0) return 11155111;
  return parsed;
}

function resolveExplorerBaseUrl(network: BlockchainNetwork) {
  const byEnv = process.env.BLOCKCHAIN_EXPLORER_BASE_URL?.trim();
  if (byEnv) return byEnv;
  if (network === "SEPOLIA") return "https://sepolia.etherscan.io/tx/";
  return "";
}

function classifyBlockchainErrorStatus(errorMessage: string): BlockchainTxLifecycleStatus {
  const normalized = errorMessage.toLowerCase();
  if (
    normalized.includes("user denied") ||
    normalized.includes("rejected") ||
    normalized.includes("cancelled")
  ) {
    return "REJECTED";
  }
  return "FAILED";
}

function hashSignature(signature: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(signature));
}

async function ensureServiceWalletAuthorizationForSync(
  actor: AuthenticatedRequest["user"],
  input: {
    walletAuthorizationId: string;
    signerWalletAddress: string;
    signerChainId: number;
  }
) {
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();
  const now = new Date();

  const authorization = await prisma.serviceWalletAuthorization.findUnique({
    where: { id: input.walletAuthorizationId },
    include: {
      wallet: {
        select: {
          id: true,
          address: true,
          network: true,
          status: true
        }
      }
    }
  });

  if (!authorization) {
    throw forbiddenError("walletAuthMissing: Không tìm thấy quyền ví công vụ");
  }

  if (authorization.status !== "ACTIVE") {
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ không còn hiệu lực");
  }

  if (authorization.effectiveTo && authorization.effectiveTo <= now) {
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ đã hết hạn");
  }

  if (authorization.network !== expectedNetwork || authorization.chainId !== expectedChainId) {
    throw forbiddenError("walletAuthMissing: Quyền ví công vụ không khớp network/chainId hệ thống");
  }

  if (input.signerChainId !== expectedChainId) {
    throw forbiddenError(
      `walletAuthMissing: signerChainId không hợp lệ. current=${input.signerChainId} expected=${expectedChainId}`
    );
  }

  const normalizedSignerAddress = ethers.getAddress(input.signerWalletAddress.trim());
  if (normalizedSignerAddress !== ethers.getAddress(authorization.wallet.address)) {
    throw forbiddenError("walletAuthMissing: Ví ký không trùng với ví công vụ được cấp quyền");
  }

  if (authorization.wallet.network !== expectedNetwork || authorization.wallet.status !== "VERIFIED") {
    throw forbiddenError("walletAuthMissing: Ví công vụ chưa xác minh hoặc không đúng network");
  }

  if (authorization.userId !== actor.userId) {
    throw forbiddenError("walletAuthMissing: Bạn không sở hữu quyền ví công vụ này");
  }

  if (authorization.roleScope !== actor.role) {
    throw forbiddenError(
      `walletAuthMissing: Vai trò ${actor.role} không khớp roleScope ${authorization.roleScope} của ví công vụ`
    );
  }

  return {
    authorization,
    expectedNetwork,
    expectedChainId,
    normalizedSignerAddress
  };
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

function readAuthorityActors(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toNotificationMessage(status: RegistrationStatus, note: string) {
  return `Hồ sơ đã được cập nhật sang trạng thái ${status}: ${note}`;
}

function assertTransitionAllowed(currentStatus: RegistrationStatus, nextStatus: RegistrationStatus, actorRole: UserRole) {
  if (nextStatus === "DA_GHI_BLOCKCHAIN") {
    throw conflictError("Không được chuyển trực tiếp sang DA_GHI_BLOCKCHAIN. Hãy dùng endpoint blockchain-sync.");
  }

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

async function findRegistrationByParam(input: string) {
  return prisma.registration.findFirst({
    where: {
      OR: [{ id: input }, { code: input }]
    },
    include: { files: true, procedure: true }
  });
}

async function ensureRegistrationReadable(
  record: { applicantId: string },
  user: AuthenticatedRequest["user"],
  message = "Bạn không có quyền xem hồ sơ này"
) {
  if (isCitizenRole(user.role) && record.applicantId !== user.userId) {
    throw forbiddenError(message);
  }
}

async function ensureEvidenceFileBelongsRegistration(registrationId: string, fileId: string) {
  const file = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    select: { id: true, registrationId: true, documentType: true, cid: true, hash: true }
  });
  if (!file || file.registrationId !== registrationId) {
    throw badRequestError("evidenceFileId không thuộc hồ sơ đăng ký");
  }
  return file;
}

async function createDocumentVersion(
  registrationId: string,
  data: {
    documentType: string;
    storageStatus: string;
    cid?: string | null;
    hash?: string | null;
    note?: string | null;
    fileAssetId?: string | null;
    createdById?: string | null;
    status?: DocumentVersionStatus;
  }
) {
  const aggregate = await prisma.registrationDocumentVersion.aggregate({
    where: { registrationId },
    _max: { versionNumber: true }
  });
  const nextVersionNumber = (aggregate._max.versionNumber ?? 0) + 1;

  return prisma.registrationDocumentVersion.create({
    data: {
      registrationId,
      versionNumber: nextVersionNumber,
      documentType: data.documentType,
      storageStatus: data.storageStatus,
      cid: data.cid ?? null,
      hash: data.hash ?? null,
      note: data.note ?? null,
      fileAssetId: data.fileAssetId ?? null,
      createdById: data.createdById ?? null,
      status: data.status ?? "ACTIVE"
    }
  });
}

async function ensureActiveDocumentVersions(registrationId: string, actorId: string) {
  let activeVersions = await prisma.registrationDocumentVersion.findMany({
    where: { registrationId, status: "ACTIVE" },
    orderBy: { versionNumber: "asc" }
  });

  if (activeVersions.length === 0) {
    const files = await prisma.fileAsset.findMany({
      where: { registrationId },
      orderBy: { createdAt: "asc" }
    });
    for (const file of files) {
      await createDocumentVersion(registrationId, {
        documentType: file.documentType,
        storageStatus: file.storageStatus,
        cid: file.cid,
        hash: file.hash,
        fileAssetId: file.id,
        note: "Khởi tạo version tự động từ file đã tải",
        createdById: actorId
      });
    }
    activeVersions = await prisma.registrationDocumentVersion.findMany({
      where: { registrationId, status: "ACTIVE" },
      orderBy: { versionNumber: "asc" }
    });
  }

  return activeVersions;
}

async function createSubmissionSnapshot(
  registrationId: string,
  actor: AuthenticatedRequest["user"],
  legalBasisCode: string,
  procedureCode: string,
  activeVersionIds: string[]
) {
  const aggregate = await prisma.registrationSubmitSnapshot.aggregate({
    where: { registrationId },
    _max: { snapshotNo: true }
  });
  const snapshotNo = (aggregate._max.snapshotNo ?? 0) + 1;

  return prisma.registrationSubmitSnapshot.create({
    data: {
      registrationId,
      snapshotNo,
      procedureCode,
      legalBasisCode,
      authorityActor: actor.role,
      documentVersionIds: activeVersionIds,
      submittedById: actor.userId
    }
  });
}

function toDocumentVersionItem(item: {
  id: string;
  versionNumber: number;
  documentType: string;
  storageStatus: string;
  cid: string | null;
  hash: string | null;
  status: DocumentVersionStatus;
  note: string | null;
  fileAssetId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    versionNumber: item.versionNumber,
    documentType: item.documentType,
    storageStatus: item.storageStatus,
    cid: item.cid,
    hash: item.hash,
    status: item.status,
    note: item.note,
    fileAssetId: item.fileAssetId,
    createdById: item.createdById,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function toPaymentObligationItem(item: {
  id: string;
  type: PaymentObligationType;
  status: PaymentObligationStatus;
  legalBasisCode: string;
  referenceNo: string | null;
  amount: Prisma.Decimal | null;
  note: string | null;
  createdById: string;
  confirmedById: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    legalBasisCode: item.legalBasisCode,
    referenceNo: item.referenceNo,
    amount: item.amount ? Number(item.amount) : null,
    note: item.note,
    createdById: item.createdById,
    confirmedById: item.confirmedById,
    confirmedAt: item.confirmedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
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
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function updateStatus(
  registrationId: string,
  status: RegistrationStatus,
  note: string,
  actor: AuthenticatedRequest["user"],
  legalBasisCode: string,
  payload: Record<string, unknown> = {}
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
      legalBasisCode,
      noteHistory: appendNoteHistory(registration.noteHistory, note),
      ...(status === "DA_CAP_NHAT_HO_SO_DIA_CHINH" ? { cadastralUpdatedAt: new Date() } : {})
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
    const code = generateRegistrationCode();
    const initialNote = "Hồ sơ được khởi tạo trên hệ thống";

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
        procedureCode,
        legalBasisCode: parsed.data.legalBasisCode ?? null,
        noteHistory: [initialNote],
        files:
          inputFileIds.length > 0
            ? {
                connect: inputFileIds.map((id) => ({ id }))
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
    if (!["MOI_TAO", "CAN_BO_SUNG"].includes(existing.status)) {
      throw conflictError("Chỉ có thể nộp hồ sơ ở trạng thái mới tạo hoặc cần bổ sung");
    }

    const procedure = await ensureProcedureAndAuthority(existing, user.role);
    const activeVersions = await ensureActiveDocumentVersions(existing.id, user.userId);
    const activeVersionIds = activeVersions.map((item) => item.id);

    if (activeVersionIds.length > 0) {
      await prisma.registrationDocumentVersion.updateMany({
        where: { id: { in: activeVersionIds } },
        data: { status: "LOCKED", updatedAt: new Date() }
      });
    }

    await createSubmissionSnapshot(existing.id, user, parsed.data.legalBasisCode, procedure.procedureCode, activeVersionIds);

    if (procedure.requiresTaxStep) {
      const intakeFee = await prisma.registrationPaymentObligation.findFirst({
        where: { registrationId: existing.id, type: "INTAKE_FEE", status: { in: ["PENDING", "CONFIRMED"] } }
      });
      if (!intakeFee) {
        await prisma.registrationPaymentObligation.create({
          data: {
            registrationId: existing.id,
            type: "INTAKE_FEE",
            status: "PENDING",
            legalBasisCode: parsed.data.legalBasisCode,
            note: "Tạo nghĩa vụ phí/lệ phí tiếp nhận khi nộp hồ sơ",
            createdById: user.userId
          }
        });
      }
    }

    const updated = await updateStatus(
      existing.id,
      "CHO_TIEP_NHAN",
      parsed.data.note ?? "Người dân đã nộp hồ sơ vào luồng tiếp nhận",
      user,
      parsed.data.legalBasisCode,
      {
        snapshotLocked: true,
        activeVersionCount: activeVersions.length
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
  requireRoles(statusMutationRoles),
  asyncHandler(async (req, res) => {
    const parsed = patchStatusSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const note = parsed.data.reason ?? `Cập nhật trạng thái hồ sơ sang ${parsed.data.status} bởi ${user.role}`;
    const updated = await updateStatus(existing.id, parsed.data.status, note, user, parsed.data.legalBasisCode);
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
    const evidenceFile = await ensureEvidenceFileBelongsRegistration(existing.id, parsed.data.evidenceFileId);

    const nextStatus: RegistrationStatus = parsed.data.confirmed ? "DA_XAC_NHAN_CAP_XA" : "CAN_BO_SUNG";
    const note = parsed.data.notes;

    const updated = await updateStatus(existing.id, nextStatus, note, user, parsed.data.legalBasisCode, {
      confirmed: parsed.data.confirmed,
      evidenceFileId: evidenceFile.id,
      evidenceDocumentType: evidenceFile.documentType
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_COMMUNE_CONFIRMATION_RECORDED",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: {
        confirmed: parsed.data.confirmed,
        note: parsed.data.notes,
        legalBasisCode: parsed.data.legalBasisCode,
        evidenceFileId: evidenceFile.id,
        evidenceCid: evidenceFile.cid,
        evidenceHash: evidenceFile.hash
      }
    });
    return ok(res, toRegistrationItem(updated), "Đã cập nhật kết quả xác nhận cấp xã");
  })
);

registrationRouter.post(
  "/:id/tax-transfer",
  requireRoles(["LAND_REGISTRY_OFFICER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = taxTransferSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

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
      parsed.data.legalBasisCode,
      { taxReferenceNo: parsed.data.taxReferenceNo }
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
        landCode: parsed.data.landCode ?? updatedStatus.landCode ?? `LAND-${Date.now()}`
      },
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
        legalBasisCode: parsed.data.legalBasisCode,
        landCode: updated.landCode
      }
    });

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

    const updated = await updateStatus(
      existing.id,
      "DA_CAP_NHAT_HO_SO_DIA_CHINH",
      parsed.data.note ?? "Đã cập nhật hồ sơ địa chính off-chain",
      user,
      parsed.data.legalBasisCode
    );
    return ok(res, toRegistrationItem(updated), "Đã ghi nhận cập nhật hồ sơ địa chính");
  })
);

registrationRouter.post(
  "/:id/blockchain-sync",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY"]),
  asyncHandler(async (req, res) => {
    const parsed = blockchainSyncSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
    if (existing.txHash || existing.tokenId) {
      throw conflictError("Hồ sơ đã có bản ghi blockchain, không thể đồng bộ lặp lại");
    }

    if (
      existing.status !== "DA_CAP_NHAT_HO_SO_DIA_CHINH" &&
      !(existing.status === "DA_CAP" && existing.cadastralUpdatedAt)
    ) {
      throw conflictError("Chỉ được đồng bộ blockchain sau khi cập nhật hồ sơ địa chính off-chain hợp lệ");
    }

    await ensureProcedureAndAuthority(existing, user.role);

    let parsedSignerAddress = "";
    try {
      parsedSignerAddress = ethers.getAddress(parsed.data.signerWalletAddress.trim());
    } catch {
      throw badRequestError("signerWalletAddress không hợp lệ");
    }

    let recoveredAddress = "";
    try {
      recoveredAddress = ethers.getAddress(ethers.verifyMessage(parsed.data.signingMessage, parsed.data.signature));
    } catch {
      throw badRequestError("signature không hợp lệ");
    }

    if (recoveredAddress !== parsedSignerAddress) {
      throw forbiddenError("walletAuthMissing: Chữ ký không khớp signerWalletAddress");
    }

    const { authorization, expectedNetwork, expectedChainId, normalizedSignerAddress } =
      await ensureServiceWalletAuthorizationForSync(user, {
        walletAuthorizationId: parsed.data.walletAuthorizationId,
        signerWalletAddress: parsed.data.signerWalletAddress,
        signerChainId: parsed.data.signerChainId
      });

    const ownerWallet = await prisma.walletAccount.findFirst({
      where: {
        userId: existing.applicantId,
        status: "VERIFIED",
        isDefault: true,
        network: expectedNetwork
      }
    });
    const effectiveLandCode = existing.landCode ?? `LAND-${existing.code}`;
    const onChainLookup = await lookupRegistrationOnChain(existing.code, effectiveLandCode);
    if (onChainLookup.registrationTokenId || onChainLookup.landTokenId) {
      throw conflictError("Bản ghi blockchain đã tồn tại cho hồ sơ hoặc mã thửa đất");
    }

    const txLifecycle = await prisma.blockchainTxLifecycle.create({
      data: {
        registrationId: existing.id,
        actorId: user.userId,
        action: "BLOCKCHAIN_SYNC",
        network: expectedNetwork,
        chainId: expectedChainId,
        walletAddress: normalizedSignerAddress,
        status: "PENDING",
        payload: {
          walletAuthorizationId: authorization.id,
          legalBasisCode: parsed.data.legalBasisCode,
          signerWalletAddress: normalizedSignerAddress,
          signerChainId: parsed.data.signerChainId,
          signingMessage: parsed.data.signingMessage,
          signatureHash: hashSignature(parsed.data.signature),
          cid: parsed.data.cid,
          metadataHash: parsed.data.metadataHash
        }
      }
    });

    let chainResult;
    try {
      chainResult = await mintRegistrationRecord({
        registrationCode: existing.code,
        landCode: effectiveLandCode,
        provinceCode: existing.provinceCode,
        communeName: existing.communeName,
        mapSheetNumber: existing.mapSheetNumber,
        parcelNumber: existing.parcelNumber,
        ownerIdentityNumber: existing.ownerIdentityNumber,
        applicantId: existing.applicantId,
        documentCid: parsed.data.cid,
        metadataHash: parsed.data.metadataHash,
        tokenOwnerAddress: ownerWallet?.address
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Blockchain sync failed";
      const failureStatus = classifyBlockchainErrorStatus(message);
      await prisma.blockchainTxLifecycle.update({
        where: { id: txLifecycle.id },
        data: {
          status: failureStatus,
          errorCode: failureStatus === "REJECTED" ? "USER_REJECTED" : "CHAIN_TX_FAILED",
          errorMessage: message
        }
      });

      await writeAuditLog({
        actorId: user.userId,
        action: `BLOCKCHAIN_TX_${failureStatus}`,
        entityType: "REGISTRATION",
        entityId: existing.id,
        payload: {
          txLifecycleId: txLifecycle.id,
          walletAuthorizationId: authorization.id,
          signerWalletAddress: normalizedSignerAddress,
          network: expectedNetwork,
          chainId: expectedChainId,
          errorMessage: message
        }
      });

      if (message.includes("verified default wallet")) {
        throw badRequestError("Người nộp hồ sơ chưa có ví mặc định đã xác minh cho mạng blockchain hiện tại");
      }
      if (
        message.includes("registration already used") ||
        message.includes("landCode already active") ||
        message.includes("already") ||
        message.includes("duplicate")
      ) {
        throw conflictError("Bản ghi blockchain đã tồn tại cho hồ sơ hoặc thửa đất này");
      }
      throw conflictError(`Không đồng bộ được blockchain: ${message}`);
    }

    const explorerBaseUrl = resolveExplorerBaseUrl(expectedNetwork);
    const explorerUrl = explorerBaseUrl && chainResult.txHash ? `${explorerBaseUrl}${chainResult.txHash}` : null;

    await prisma.blockchainTxLifecycle.update({
      where: { id: txLifecycle.id },
      data: {
        status: "CONFIRMED",
        txHash: chainResult.txHash,
        explorerUrl,
        errorCode: null,
        errorMessage: null
      }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "BLOCKCHAIN_TX_PENDING",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: {
        txLifecycleId: txLifecycle.id,
        walletAuthorizationId: authorization.id,
        signerWalletAddress: normalizedSignerAddress,
        network: expectedNetwork,
        chainId: expectedChainId
      }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "BLOCKCHAIN_TX_CONFIRMED",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: {
        txLifecycleId: txLifecycle.id,
        txHash: chainResult.txHash,
        explorerUrl
      }
    });

    const updated = await prisma.registration.update({
      where: { id: existing.id },
      data: {
        status: "DA_GHI_BLOCKCHAIN",
        legalBasisCode: parsed.data.legalBasisCode,
        ipfsCid: parsed.data.cid,
        documentHash: parsed.data.metadataHash,
        txHash: chainResult.txHash,
        tokenId: chainResult.tokenId ?? existing.tokenId,
        noteHistory: appendNoteHistory(existing.noteHistory, "Đã đồng bộ metadata hồ sơ lên blockchain")
      },
      include: { files: true }
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_BLOCKCHAIN_SYNCED",
      entityType: "REGISTRATION",
      entityId: updated.id,
      payload: {
        cid: parsed.data.cid,
        metadataHash: parsed.data.metadataHash,
        txHash: updated.txHash,
        legalBasisCode: parsed.data.legalBasisCode,
        tokenId: updated.tokenId,
        blockchainMode: chainResult.mode,
        walletNetwork: expectedNetwork,
        ownerWalletAddress: ownerWallet?.address ?? null,
        signerWalletAddress: normalizedSignerAddress,
        signerChainId: expectedChainId,
        serviceWalletAuthorizationId: authorization.id,
        txLifecycleId: txLifecycle.id,
        onChainPrecheck: {
          mode: onChainLookup.mode,
          contractAddress: onChainLookup.contractAddress,
          registrationTokenId: onChainLookup.registrationTokenId,
          landTokenId: onChainLookup.landTokenId
        }
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

    const missingChecklist = parsed.data.missingItems
      .map((item, index) => `${index + 1}. ${item}`)
      .join("; ");
    const note = `${parsed.data.note} | Danh mục thiếu: ${missingChecklist} | Hạn bổ sung: ${parsed.data.deadlineAt}`;

    const updated = await updateStatus(existing.id, "CAN_BO_SUNG", note, user, parsed.data.legalBasisCode, {
      missingItems: parsed.data.missingItems,
      deadlineAt: parsed.data.deadlineAt
    });

    await writeAuditLog({
      actorId: user.userId,
      action: "REGISTRATION_SUPPLEMENT_REQUESTED",
      entityType: "REGISTRATION",
      entityId: existing.id,
      payload: {
        legalBasisCode: parsed.data.legalBasisCode,
        missingItems: parsed.data.missingItems,
        deadlineAt: parsed.data.deadlineAt
      }
    });
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
    const parsed = submitSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(
      existing.id,
      "DA_TIEP_NHAN",
      parsed.data.note ?? "Bộ phận một cửa đã tiếp nhận hồ sơ",
      user,
      parsed.data.legalBasisCode
    );
    return ok(res, toRegistrationItem(updated), "Đã tiếp nhận hồ sơ hợp lệ");
  })
);

registrationRouter.post(
  "/:id/reject",
  requireRoles(["LAND_REGISTRY_OFFICER", "APPROVAL_AUTHORITY", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const parsed = requiredNoteSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

    const user = (req as AuthenticatedRequest).user;
    const existing = await findRegistrationByParam(String(req.params.id));
    if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

    const updated = await updateStatus(existing.id, "TU_CHOI", parsed.data.note, user, parsed.data.legalBasisCode);
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
