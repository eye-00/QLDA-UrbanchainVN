import {
  BlockchainTxLifecycleStatus,
  DocumentVersionStatus,
  Prisma,
  RegistrationStatus
} from "@prisma/client";
import { ethers } from "ethers";
import {
  lookupRegistrationOnChain,
  mintRegistrationRecord
} from "../../lib/blockchain/urban-land-registry.client.js";
import { badRequestError, conflictError, forbiddenError, notFoundError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/services/audit.service.js";
import {
  isCitizenRole,
  resolveBlockchainSyncMode,
  resolveExpectedBlockchainChainId,
  resolveExpectedBlockchainNetwork,
  resolveExplorerBaseUrl,
  ensureCitizenWalletAuthorizationForSync,
  ensureServiceWalletAuthorizationForSync
} from "../../lib/services/wallet-auth.service.js";
import {
  assertTransitionAllowed,
  ensureProcedureAndAuthority
} from "../../lib/services/workflow.service.js";
import type { AuthUser } from "../auth/auth.middleware.js";
import { appendNoteHistory, readJsonObject, toNotificationMessage } from "./registration.mapper.js";
import { DEFAULT_REGISTRATION_PROCEDURE_CODE } from "./registration.validation.js";

// ─── Private helpers ────────────────────────────────────────────────

function hashSignature(signature: string) {
  return ethers.keccak256(ethers.toUtf8Bytes(signature));
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

function generateRegistrationCode() {
  const now = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `REG-${new Date().getFullYear()}-${now}-${randomSuffix}`;
}

async function writeRegistrationNotificationLog(
  registrationId: string,
  actor: AuthUser,
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
  user: AuthUser,
  message = "Bạn không có quyền xem hồ sơ này"
) {
  if (isCitizenRole(user.role) && record.applicantId !== user.userId) {
    throw forbiddenError(message);
  }
}

async function ensureEvidenceFileBelongsRegistration(registrationId: string, fileId: string) {
  const file = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      registrationId: true,
      documentType: true,
      cid: true,
      hash: true
    }
  });
  if (!file || file.registrationId !== registrationId) {
    throw badRequestError("evidenceFileId không thuộc hồ sơ đăng ký");
  }
  return file;
}

async function createDocumentVersionRecord(
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
      await createDocumentVersionRecord(registrationId, {
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
  actor: AuthUser,
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

async function updateStatus(
  registrationId: string,
  status: RegistrationStatus,
  note: string,
  actor: AuthUser,
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

// ─── Exported service functions ─────────────────────────────────────

export async function createRegistration(
  user: AuthUser,
  body: {
    landInfo: {
      provinceCode: string;
      communeName: string;
      parcelNumber: string;
      mapSheetNumber: string;
      area: number;
      landUsePurpose: string;
      address: string;
    };
    ownerInfo: { ownerType: string; fullName: string; identityNumber?: string; address?: string };
    procedureCode?: string;
    legalBasisCode?: string;
    attachedFileIds?: string[];
    fileIds?: string[];
  }
) {
  const requestedProcedureCode = body.procedureCode?.trim().toUpperCase();
  const procedureCode = requestedProcedureCode || DEFAULT_REGISTRATION_PROCEDURE_CODE;
  const procedure = await prisma.legalProcedure.findUnique({
    where: { procedureCode }
  });
  if (!procedure || !procedure.isActive) {
    if (!requestedProcedureCode) {
      throw badRequestError(
        `Thiếu procedureCode và thủ tục mặc định ${DEFAULT_REGISTRATION_PROCEDURE_CODE} không hợp lệ hoặc đã ngừng áp dụng`
      );
    }
    throw badRequestError("procedureCode không hợp lệ hoặc đã ngừng áp dụng");
  }

  const inputFileIds = body.attachedFileIds ?? body.fileIds ?? [];
  const code = generateRegistrationCode();
  const initialNote = "Hồ sơ được khởi tạo trên hệ thống";

  const record = await prisma.registration.create({
    data: {
      code,
      applicantId: user.userId,
      provinceCode: body.landInfo.provinceCode,
      communeName: body.landInfo.communeName,
      parcelNumber: body.landInfo.parcelNumber,
      mapSheetNumber: body.landInfo.mapSheetNumber,
      area: new Prisma.Decimal(body.landInfo.area),
      landUsePurpose: body.landInfo.landUsePurpose,
      address: body.landInfo.address,
      ownerType: body.ownerInfo.ownerType,
      ownerFullName: body.ownerInfo.fullName,
      ownerIdentityNumber: body.ownerInfo.identityNumber,
      ownerAddress: body.ownerInfo.address,
      procedureCode,
      legalBasisCode: body.legalBasisCode ?? null,
      noteHistory: [initialNote],
      files: inputFileIds.length > 0 ? { connect: inputFileIds.map((id) => ({ id })) } : undefined
    },
    include: { files: true }
  });

  for (const file of record.files) {
    await createDocumentVersionRecord(record.id, {
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

  return record;
}

export async function listRegistrations(
  user: AuthUser,
  query: {
    status?: string;
    keyword?: string;
    procedureCode?: string;
    page: number;
    pageSize: number;
  }
) {
  const { page, pageSize, status, keyword, procedureCode } = query;
  const where: Prisma.RegistrationWhereInput = {
    ...(status ? { status: status as RegistrationStatus } : {}),
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

  return { items, total };
}

export async function getRegistrationDetail(registrationId: string, user: AuthUser) {
  const record = await findRegistrationByParam(registrationId);
  if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureRegistrationReadable(record, user);
  return record;
}

export async function submitRegistration(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    note?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  if (existing.applicantId !== user.userId)
    throw forbiddenError("Bạn không có quyền nộp hồ sơ này");
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

  await createSubmissionSnapshot(
    existing.id,
    user,
    body.legalBasisCode,
    procedure.procedureCode,
    activeVersionIds
  );

  if (procedure.requiresTaxStep) {
    const intakeFee = await prisma.registrationPaymentObligation.findFirst({
      where: {
        registrationId: existing.id,
        type: "INTAKE_FEE",
        status: { in: ["PENDING", "CONFIRMED"] }
      }
    });
    if (!intakeFee) {
      await prisma.registrationPaymentObligation.create({
        data: {
          registrationId: existing.id,
          type: "INTAKE_FEE",
          status: "PENDING",
          legalBasisCode: body.legalBasisCode,
          note: "Tạo nghĩa vụ phí/lệ phí tiếp nhận khi nộp hồ sơ",
          createdById: user.userId
        }
      });
    }
  }

  const note = body.note ?? "Người dân đã nộp hồ sơ vào luồng tiếp nhận";
  const updated = await updateStatus(
    existing.id,
    "CHO_TIEP_NHAN",
    note,
    user,
    body.legalBasisCode,
    {
      snapshotLocked: true,
      activeVersionCount: activeVersions.length
    }
  );

  await prisma.registration.update({
    where: { id: existing.id },
    data: {
      submittedSnapshotLocked: true,
      legalBasisCode: body.legalBasisCode
    }
  });

  return updated;
}

export async function patchStatus(
  registrationId: string,
  user: AuthUser,
  body: {
    status: RegistrationStatus;
    legalBasisCode: string;
    reason?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  const note = body.reason ?? `Cập nhật trạng thái hồ sơ sang ${body.status} bởi ${user.role}`;
  return updateStatus(existing.id, body.status, note, user, body.legalBasisCode);
}

export async function communeConfirm(
  registrationId: string,
  user: AuthUser,
  body: {
    confirmed: boolean;
    legalBasisCode: string;
    notes: string;
    evidenceFileId: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  const evidenceFile = await ensureEvidenceFileBelongsRegistration(
    existing.id,
    body.evidenceFileId
  );

  const nextStatus: RegistrationStatus = body.confirmed ? "DA_XAC_NHAN_CAP_XA" : "CAN_BO_SUNG";

  const updated = await updateStatus(
    existing.id,
    nextStatus,
    body.notes,
    user,
    body.legalBasisCode,
    {
      confirmed: body.confirmed,
      evidenceFileId: evidenceFile.id,
      evidenceDocumentType: evidenceFile.documentType
    }
  );

  await writeAuditLog({
    actorId: user.userId,
    action: "REGISTRATION_COMMUNE_CONFIRMATION_RECORDED",
    entityType: "REGISTRATION",
    entityId: existing.id,
    payload: {
      confirmed: body.confirmed,
      note: body.notes,
      legalBasisCode: body.legalBasisCode,
      evidenceFileId: evidenceFile.id,
      evidenceCid: evidenceFile.cid,
      evidenceHash: evidenceFile.hash
    }
  });

  return updated;
}

export async function taxTransfer(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    taxReferenceNo: string;
    amount?: number;
    notes?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  await prisma.registrationPaymentObligation.create({
    data: {
      registrationId: existing.id,
      type: "LAND_FINANCIAL_OBLIGATION",
      status: "PENDING",
      legalBasisCode: body.legalBasisCode,
      referenceNo: body.taxReferenceNo,
      amount: body.amount ? new Prisma.Decimal(body.amount) : null,
      note: body.notes ?? "Đã chuyển thông tin xác định nghĩa vụ tài chính",
      createdById: user.userId
    }
  });

  return updateStatus(
    existing.id,
    "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH",
    body.notes ?? "Đã chuyển thông tin xác định nghĩa vụ tài chính sang cơ quan thuế",
    user,
    body.legalBasisCode,
    { taxReferenceNo: body.taxReferenceNo }
  );
}

export async function approveRegistration(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    approvalNumber?: string;
    approvalDate?: string;
    note?: string;
    landCode?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  const updatedStatus = await updateStatus(
    existing.id,
    "DA_KY_CAP",
    body.note ?? "Hồ sơ đã được phê duyệt/ký cấp",
    user,
    body.legalBasisCode,
    {
      approvalNumber: body.approvalNumber ?? null,
      approvalDate: body.approvalDate ?? null
    }
  );

  const updated = await prisma.registration.update({
    where: { id: updatedStatus.id },
    data: {
      landCode: body.landCode ?? updatedStatus.landCode ?? `LAND-${Date.now()}`
    },
    include: { files: true }
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "REGISTRATION_APPROVED",
    entityType: "REGISTRATION",
    entityId: updated.id,
    payload: {
      approvalNumber: body.approvalNumber ?? null,
      approvalDate: body.approvalDate ?? null,
      legalBasisCode: body.legalBasisCode,
      landCode: updated.landCode
    }
  });

  return updated;
}

export async function cadastralUpdate(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    note?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  return updateStatus(
    existing.id,
    "DA_CAP_NHAT_HO_SO_DIA_CHINH",
    body.note ?? "Đã cập nhật hồ sơ địa chính off-chain",
    user,
    body.legalBasisCode
  );
}

export async function blockchainSync(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    syncMode?: "OFFICER_SERVICE_WALLET" | "CITIZEN_DIRECT_SIGN";
    cid: string;
    metadataHash: string;
    walletAuthorizationId?: string;
    signerWalletAddress: string;
    signerChainId: number;
    signingMessage: string;
    signature: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  if (existing.txHash || existing.tokenId) {
    throw conflictError("Hồ sơ đã có bản ghi blockchain, không thể đồng bộ lặp lại");
  }

  if (
    existing.status !== "DA_CAP_NHAT_HO_SO_DIA_CHINH" &&
    !(existing.status === "DA_CAP" && existing.cadastralUpdatedAt)
  ) {
    throw conflictError(
      `STATUS_NOT_READY: Chỉ được đồng bộ blockchain sau khi cập nhật hồ sơ địa chính off-chain hợp lệ. currentStatus=${existing.status}`
    );
  }

  await ensureProcedureAndAuthority(existing, user.role);

  let parsedSignerAddress = "";
  try {
    parsedSignerAddress = ethers.getAddress(body.signerWalletAddress.trim());
  } catch {
    throw badRequestError("signerWalletAddress không hợp lệ");
  }

  let recoveredAddress = "";
  try {
    recoveredAddress = ethers.getAddress(ethers.verifyMessage(body.signingMessage, body.signature));
  } catch {
    throw badRequestError("signature không hợp lệ");
  }

  if (recoveredAddress !== parsedSignerAddress) {
    throw forbiddenError("walletAuthMissing: Chữ ký không khớp signerWalletAddress");
  }

  const syncMode = resolveBlockchainSyncMode(user.role, body.syncMode);
  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();
  let normalizedSignerAddress = parsedSignerAddress;
  let authorization:
    | Awaited<ReturnType<typeof ensureServiceWalletAuthorizationForSync>>["authorization"]
    | null = null;

  if (syncMode === "OFFICER_SERVICE_WALLET") {
    if (!body.walletAuthorizationId) {
      throw badRequestError(
        "walletAuthMissing: walletAuthorizationId là bắt buộc cho OFFICER_SERVICE_WALLET"
      );
    }
    const verified = await ensureServiceWalletAuthorizationForSync(user, {
      walletAuthorizationId: body.walletAuthorizationId,
      signerWalletAddress: body.signerWalletAddress,
      signerChainId: body.signerChainId
    });
    authorization = verified.authorization;
    normalizedSignerAddress = verified.normalizedSignerAddress;
  } else {
    const verified = await ensureCitizenWalletAuthorizationForSync(user, existing.applicantId, {
      signerWalletAddress: body.signerWalletAddress,
      signerChainId: body.signerChainId
    });
    normalizedSignerAddress = verified.normalizedSignerAddress;
  }

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
        syncMode,
        walletAuthorizationId: authorization?.id ?? null,
        legalBasisCode: body.legalBasisCode,
        signerWalletAddress: normalizedSignerAddress,
        signerChainId: body.signerChainId,
        signingMessage: body.signingMessage,
        signatureHash: hashSignature(body.signature),
        cid: body.cid,
        metadataHash: body.metadataHash
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
      documentCid: body.cid,
      metadataHash: body.metadataHash,
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
        syncMode,
        walletAuthorizationId: authorization?.id ?? null,
        signerWalletAddress: normalizedSignerAddress,
        network: expectedNetwork,
        chainId: expectedChainId,
        errorMessage: message
      }
    });

    if (message.includes("verified default wallet")) {
      throw badRequestError(
        "Người nộp hồ sơ chưa có ví mặc định đã xác minh cho mạng blockchain hiện tại"
      );
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
  const explorerUrl =
    explorerBaseUrl && chainResult.txHash ? `${explorerBaseUrl}${chainResult.txHash}` : null;

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
      syncMode,
      walletAuthorizationId: authorization?.id ?? null,
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
      legalBasisCode: body.legalBasisCode,
      ipfsCid: body.cid,
      documentHash: body.metadataHash,
      txHash: chainResult.txHash,
      tokenId: chainResult.tokenId ?? existing.tokenId,
      noteHistory: appendNoteHistory(
        existing.noteHistory,
        "Đã đồng bộ metadata hồ sơ lên blockchain"
      )
    },
    include: { files: true }
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "REGISTRATION_BLOCKCHAIN_SYNCED",
    entityType: "REGISTRATION",
    entityId: updated.id,
    payload: {
      cid: body.cid,
      metadataHash: body.metadataHash,
      txHash: updated.txHash,
      legalBasisCode: body.legalBasisCode,
      tokenId: updated.tokenId,
      blockchainMode: chainResult.mode,
      walletNetwork: expectedNetwork,
      ownerWalletAddress: ownerWallet?.address ?? null,
      signerWalletAddress: normalizedSignerAddress,
      signerChainId: expectedChainId,
      syncMode,
      serviceWalletAuthorizationId: authorization?.id ?? null,
      txLifecycleId: txLifecycle.id,
      onChainPrecheck: {
        mode: onChainLookup.mode,
        contractAddress: onChainLookup.contractAddress,
        registrationTokenId: onChainLookup.registrationTokenId,
        landTokenId: onChainLookup.landTokenId
      }
    }
  });

  await writeRegistrationNotificationLog(
    updated.id,
    user,
    updated.status,
    "Đã đồng bộ metadata hồ sơ lên blockchain"
  );

  return {
    registrationId: updated.id,
    tokenId: updated.tokenId,
    txHash: updated.txHash,
    status: "CONFIRMED" as const,
    syncMode,
    chainId: expectedChainId,
    contractAddress: onChainLookup.contractAddress,
    explorerUrl,
    cid: updated.ipfsCid,
    metadataHash: updated.documentHash
  };
}

export async function supplementRequest(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    note: string;
    missingItems: string[];
    deadlineAt: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  const missingChecklist = body.missingItems
    .map((item, index) => `${index + 1}. ${item}`)
    .join("; ");
  const note = `${body.note} | Danh mục thiếu: ${missingChecklist} | Hạn bổ sung: ${body.deadlineAt}`;

  const updated = await updateStatus(existing.id, "CAN_BO_SUNG", note, user, body.legalBasisCode, {
    missingItems: body.missingItems,
    deadlineAt: body.deadlineAt
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "REGISTRATION_SUPPLEMENT_REQUESTED",
    entityType: "REGISTRATION",
    entityId: existing.id,
    payload: {
      legalBasisCode: body.legalBasisCode,
      missingItems: body.missingItems,
      deadlineAt: body.deadlineAt
    }
  });

  return updated;
}

export { supplementRequest as requestSupplement };

export async function acceptRegistration(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    note?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  return updateStatus(
    existing.id,
    "DA_TIEP_NHAN",
    body.note ?? "Bộ phận một cửa đã tiếp nhận hồ sơ",
    user,
    body.legalBasisCode
  );
}

export async function rejectRegistration(
  registrationId: string,
  user: AuthUser,
  body: {
    legalBasisCode: string;
    note: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  return updateStatus(existing.id, "TU_CHOI", body.note, user, body.legalBasisCode);
}

export async function getBlockchainStatus(registrationId: string, user: AuthUser) {
  const existing = await findRegistrationByParam(registrationId);
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

  return {
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
  };
}

export async function getTxLifecycleHistory(registrationId: string, user: AuthUser) {
  const existing = await findRegistrationByParam(registrationId);
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

  return { items, total: items.length };
}

export async function getBlockchainCandidates(registrationId: string, user: AuthUser) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");

  const expectedNetwork = resolveExpectedBlockchainNetwork();
  const expectedChainId = resolveExpectedBlockchainChainId();
  const now = new Date();

  const items = await prisma.serviceWalletAuthorization.findMany({
    where: {
      userId: user.userId,
      roleScope: user.role,
      status: "ACTIVE",
      network: expectedNetwork,
      chainId: expectedChainId,
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }]
    },
    include: {
      wallet: {
        select: {
          address: true,
          status: true,
          network: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const mapped = items.map((item) => ({
    authorizationId: item.id,
    walletAddress: item.wallet.address,
    walletStatus: item.wallet.status,
    network: item.network,
    chainId: item.chainId,
    roleScope: item.roleScope,
    effectiveTo: item.effectiveTo,
    status: item.status
  }));

  return { items: mapped, total: mapped.length };
}

export async function getDocumentVersions(registrationId: string, user: AuthUser) {
  const record = await findRegistrationByParam(registrationId);
  if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureRegistrationReadable(record, user);

  const items = await prisma.registrationDocumentVersion.findMany({
    where: { registrationId: record.id },
    orderBy: [{ versionNumber: "desc" }]
  });

  return { items, total: items.length };
}

export async function createDocumentVersion(
  registrationId: string,
  user: AuthUser,
  body: {
    documentType: string;
    storageStatus: string;
    fileAssetId?: string;
    cid?: string;
    hash?: string;
    note?: string;
  }
) {
  const record = await findRegistrationByParam(registrationId);
  if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureRegistrationReadable(record, user, "Bạn không có quyền cập nhật tài liệu hồ sơ này");

  let fileRef: {
    id: string;
    documentType: string;
    storageStatus: string;
    cid: string | null;
    hash: string | null;
  } | null = null;
  if (body.fileAssetId) {
    const file = await prisma.fileAsset.findUnique({
      where: { id: body.fileAssetId }
    });
    if (!file || file.registrationId !== record.id) {
      throw badRequestError("fileAssetId không thuộc hồ sơ đăng ký");
    }
    fileRef = file;
  }

  await prisma.registrationDocumentVersion.updateMany({
    where: {
      registrationId: record.id,
      documentType: body.documentType,
      status: "ACTIVE"
    },
    data: {
      status: "REPLACED",
      updatedAt: new Date()
    }
  });

  const createdVersion = await createDocumentVersionRecord(record.id, {
    documentType: body.documentType,
    storageStatus: body.storageStatus,
    cid: body.cid ?? fileRef?.cid ?? null,
    hash: body.hash ?? fileRef?.hash ?? null,
    note: body.note,
    fileAssetId: body.fileAssetId ?? null,
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

  return createdVersion;
}

export async function getSnapshots(registrationId: string, user: AuthUser) {
  const record = await findRegistrationByParam(registrationId);
  if (!record) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureRegistrationReadable(record, user);

  const items = await prisma.registrationSubmitSnapshot.findMany({
    where: { registrationId: record.id },
    orderBy: { snapshotNo: "desc" }
  });

  return { items, total: items.length };
}

export async function getDocumentHistory(registrationId: string, user: AuthUser) {
  const record = await findRegistrationByParam(registrationId);
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
        action: {
          in: [
            "REGISTRATION_STATUS_UPDATED",
            "REGISTRATION_APPROVED",
            "REGISTRATION_BLOCKCHAIN_SYNCED"
          ]
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const versionEvents = versions.map((item) => ({
    id: item.id,
    type: "DOCUMENT_VERSION" as const,
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
    type: "SUBMIT_SNAPSHOT" as const,
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
    type: "STATUS_AUDIT" as const,
    at: item.createdAt,
    title: `Cập nhật xử lý: ${item.action}`,
    detail: item.payload ?? {}
  }));

  const items = [...versionEvents, ...snapshotEvents, ...statusEvents].sort(
    (a, b) => b.at.getTime() - a.at.getTime()
  );

  return { items, total: items.length };
}

export async function getNotificationHistory(registrationId: string, user: AuthUser) {
  const record = await findRegistrationByParam(registrationId);
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

  return { items, total: items.length };
}

export async function getPaymentObligations(registrationId: string, user: AuthUser) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureRegistrationReadable(existing, user);

  const items = await prisma.registrationPaymentObligation.findMany({
    where: { registrationId: existing.id },
    orderBy: { createdAt: "desc" }
  });

  return { items, total: items.length };
}

export async function createPaymentObligation(
  registrationId: string,
  user: AuthUser,
  body: {
    type:
      | "INTAKE_FEE"
      | "LAND_FINANCIAL_OBLIGATION"
      | "REGISTRATION_FEE"
      | "LATE_FEE"
      | "OTHER_LEGAL_FEE";
    legalBasisCode: string;
    referenceNo?: string;
    noticeRef?: string;
    receiptRef?: string;
    receiptFileId?: string;
    amount?: number;
    note?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureProcedureAndAuthority(existing, user.role);

  if (
    body.type === "LAND_FINANCIAL_OBLIGATION" &&
    !["LAND_REGISTRY_OFFICER", "TAX_OFFICER", "ADMIN"].includes(user.role)
  ) {
    throw forbiddenError("Vai trò hiện tại không được tạo nghĩa vụ tài chính đất đai");
  }

  if (body.receiptFileId) {
    const receiptFile = await prisma.fileAsset.findUnique({
      where: { id: body.receiptFileId },
      select: { id: true, registrationId: true }
    });
    if (!receiptFile || receiptFile.registrationId !== existing.id) {
      throw badRequestError("receiptFileId không thuộc hồ sơ đăng ký liên quan");
    }
  }

  const obligation = await prisma.registrationPaymentObligation.create({
    data: {
      registrationId: existing.id,
      type: body.type,
      legalBasisCode: body.legalBasisCode,
      referenceNo: body.referenceNo,
      noticeRef: body.noticeRef ?? null,
      receiptRef: body.receiptRef ?? null,
      receiptFileId: body.receiptFileId ?? null,
      ...(body.noticeRef ? { noticeIssuedAt: new Date() } : {}),
      ...(body.receiptRef || body.receiptFileId ? { receiptSubmittedAt: new Date() } : {}),
      amount: body.amount ? new Prisma.Decimal(body.amount) : null,
      note: body.note ?? null,
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

  return obligation;
}

export async function updatePaymentObligation(
  registrationId: string,
  obligationId: string,
  user: AuthUser,
  body: {
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    legalBasisCode: string;
    note?: string;
  }
) {
  const existing = await findRegistrationByParam(registrationId);
  if (!existing) throw notFoundError("Không tìm thấy hồ sơ đăng ký");
  await ensureProcedureAndAuthority(existing, user.role);

  const obligation = await prisma.registrationPaymentObligation.findFirst({
    where: {
      id: obligationId,
      registrationId: existing.id
    }
  });
  if (!obligation) throw notFoundError("Không tìm thấy nghĩa vụ tài chính");

  const updatedObligation = await prisma.registrationPaymentObligation.update({
    where: { id: obligation.id },
    data: {
      status: body.status,
      legalBasisCode: body.legalBasisCode,
      note: body.note ?? obligation.note,
      ...(body.status === "CONFIRMED"
        ? { confirmedById: user.userId, confirmedAt: new Date() }
        : {})
    }
  });

  if (body.status === "CONFIRMED" && existing.status === "CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH") {
    await updateStatus(
      existing.id,
      "DA_HOAN_THANH_NGHIA_VU_TAI_CHINH",
      body.note ?? "Đã hoàn thành nghĩa vụ tài chính",
      user,
      body.legalBasisCode
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
      legalBasisCode: body.legalBasisCode
    }
  });

  return updatedObligation;
}
