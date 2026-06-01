import {
  DocumentVersionStatus,
  PaymentObligationStatus,
  PaymentObligationType,
  Prisma,
  RegistrationStatus
} from "@prisma/client";

export function parseNoteHistory(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function appendNoteHistory(value: Prisma.JsonValue | null, note: string): string[] {
  return [...parseNoteHistory(value), note];
}

export function readJsonObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function toNotificationMessage(status: RegistrationStatus, note: string) {
  return `Hồ sơ đã được cập nhật sang trạng thái ${status}: ${note}`;
}

export function toDocumentVersionItem(item: {
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

export function toPaymentObligationItem(item: {
  id: string;
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

export function toRegistrationItem(item: {
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

export function toBlockchainTxItem(item: {
  id: string;
  action: string;
  network: string;
  chainId: number;
  walletAddress: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
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
  };
}
