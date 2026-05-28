import { UserRole } from '../auth/roles';

export type RegistrationReviewFilters = {
  keyword: string;
  status: string;
};

export type ReviewActionKey =
  | 'accept'
  | 'requestSupplement'
  | 'reject'
  | 'communeConfirm'
  | 'taxTransfer'
  | 'approve'
  | 'cadastralUpdate'
  | 'blockchainSync';

export type ReviewStepState = 'done' | 'current' | 'todo';

export type ReviewStep = {
  key: string;
  label: string;
  state: ReviewStepState;
};

export type CommuneConfirmPayload = {
  confirmed: boolean;
  legalBasisCode: string;
  notes: string;
  evidenceFileId: string;
};

export type SupplementRequestPayload = {
  legalBasisCode: string;
  note: string;
  missingItems: string[];
  deadlineAt: string;
};

const STATUS_PROGRESS_MAP: Record<string, number> = {
  MOI_TAO: 0,
  CHO_TIEP_NHAN: 1,
  CAN_BO_SUNG: 1,
  DA_TIEP_NHAN: 2,
  CHO_XAC_NHAN_CAP_XA: 2,
  DA_XAC_NHAN_CAP_XA: 3,
  DANG_THAM_DINH_VPDKDD: 3,
  CHO_THUE: 4,
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: 4,
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: 4,
  CHO_KY_CAP: 5,
  DA_KY_CAP: 6,
  DA_CAP_NHAT_HO_SO_DIA_CHINH: 6,
  DA_GHI_BLOCKCHAIN: 6,
  DA_CAP: 6,
  DA_TRA_KET_QUA: 6,
  TU_CHOI: 2
};

const STEP_KEYS = [
  'submitted',
  'accepted',
  'commune',
  'appraisal',
  'tax',
  'approval',
  'completed'
] as const;

const STEP_LABELS: Record<(typeof STEP_KEYS)[number], string> = {
  submitted: 'Nộp hồ sơ',
  accepted: 'Tiếp nhận',
  commune: 'Xác nhận cấp xã',
  appraisal: 'Thẩm định VPĐKĐĐ',
  tax: 'Xử lý thuế',
  approval: 'Phê duyệt',
  completed: 'Hoàn tất'
};

const PROCESSING_STATUSES = [
  'CHO_TIEP_NHAN',
  'DA_TIEP_NHAN',
  'CHO_XAC_NHAN_CAP_XA',
  'DA_XAC_NHAN_CAP_XA',
  'DANG_THAM_DINH_VPDKDD',
  'CHO_THUE',
  'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH',
  'CHO_KY_CAP',
  'DA_HOAN_THANH_NGHIA_VU_TAI_CHINH'
] as const;

const ACTION_STATUS_MATRIX: Record<ReviewActionKey, readonly string[]> = {
  accept: ['CHO_TIEP_NHAN', 'CAN_BO_SUNG'],
  requestSupplement: PROCESSING_STATUSES,
  reject: PROCESSING_STATUSES,
  communeConfirm: ['DA_TIEP_NHAN', 'CHO_XAC_NHAN_CAP_XA'],
  taxTransfer: ['DA_XAC_NHAN_CAP_XA', 'DANG_THAM_DINH_VPDKDD'],
  approve: ['CHO_KY_CAP', 'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH', 'DA_HOAN_THANH_NGHIA_VU_TAI_CHINH'],
  cadastralUpdate: ['DA_KY_CAP', 'DA_CAP'],
  blockchainSync: ['DA_CAP_NHAT_HO_SO_DIA_CHINH']
};

export function buildRegistrationReviewQuery(filters: RegistrationReviewFilters) {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.status) params.set('status', filters.status);
  params.set('pageSize', '50');
  return params.toString();
}

export function requiresActionNote(action: 'supplement' | 'reject', note: string) {
  return Boolean(note.trim());
}

export function isTaxTransferReady(taxReferenceNo: string) {
  return Boolean(taxReferenceNo.trim());
}

export function isBlockchainSyncReady(cid: string, metadataHash: string) {
  return Boolean(cid.trim() && metadataHash.trim());
}

export function isCommuneConfirmReady(note: string, evidenceFileId: string) {
  return note.trim().length >= 3 && evidenceFileId.trim().length >= 3;
}

export function parseMissingItems(input: string) {
  return input
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isFutureDateTime(deadlineAt: string, now = new Date()) {
  if (!deadlineAt.trim()) return false;
  const deadline = new Date(deadlineAt);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() > now.getTime();
}

export function buildCommuneConfirmPayload(input: {
  confirmed: boolean;
  legalBasisCode: string;
  note: string;
  evidenceFileId: string;
}): CommuneConfirmPayload {
  return {
    confirmed: input.confirmed,
    legalBasisCode: input.legalBasisCode.trim(),
    notes: input.note.trim(),
    evidenceFileId: input.evidenceFileId.trim()
  };
}

export function buildSupplementRequestPayload(input: {
  legalBasisCode: string;
  note: string;
  missingItemsInput: string;
  deadlineAt: string;
}): SupplementRequestPayload {
  return {
    legalBasisCode: input.legalBasisCode.trim(),
    note: input.note.trim(),
    missingItems: parseMissingItems(input.missingItemsInput),
    deadlineAt: input.deadlineAt
  };
}

export function isActionAllowedForStatus(action: ReviewActionKey, status: string) {
  return ACTION_STATUS_MATRIX[action].includes(status);
}

export function getAllowedReviewActionsByStatus(status: string) {
  return (Object.keys(ACTION_STATUS_MATRIX) as ReviewActionKey[]).filter((action) =>
    isActionAllowedForStatus(action, status)
  );
}

export function toBlockchainDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 'Chưa có';
  if (typeof value === 'string' && value.trim() === '') return 'Chưa có';
  return String(value);
}

export function getReviewStepsByStatus(status: string) {
  const currentProgress = STATUS_PROGRESS_MAP[status] ?? 0;
  return STEP_KEYS.map((key, index): ReviewStep => {
    let state: ReviewStepState = 'todo';
    if (index < currentProgress) state = 'done';
    if (index === currentProgress) state = 'current';
    if (status === 'TU_CHOI' && index > currentProgress) state = 'todo';
    return { key, label: STEP_LABELS[key], state };
  });
}

export function getReviewPermissions(role: UserRole | undefined) {
  const isAdmin = role === 'ADMIN';
  return {
    canAccept: role === 'RECEPTION_OFFICER' || isAdmin,
    canCommuneConfirm: role === 'COMMUNE_OFFICER' || isAdmin,
    canTaxTransfer: role === 'LAND_REGISTRY_OFFICER' || isAdmin,
    canConfirmPaymentObligation: role === 'TAX_OFFICER' || isAdmin,
    canApprove: role === 'APPROVAL_AUTHORITY' || isAdmin,
    canReject: role === 'LAND_REGISTRY_OFFICER' || role === 'TAX_OFFICER' || role === 'APPROVAL_AUTHORITY' || isAdmin,
    canRequestSupplement:
      role === 'RECEPTION_OFFICER' ||
      role === 'COMMUNE_OFFICER' ||
      role === 'LAND_REGISTRY_OFFICER' ||
      role === 'TAX_OFFICER' ||
      isAdmin,
    canCadastralUpdate: role === 'LAND_REGISTRY_OFFICER' || isAdmin,
    canBlockchainSync: role === 'LAND_REGISTRY_OFFICER' || role === 'APPROVAL_AUTHORITY'
  };
}
