import { UserRole } from '../auth/roles';

export type RegistrationReviewFilters = {
  keyword: string;
  status: string;
};

export type ReviewStepState = 'done' | 'current' | 'todo';

export type ReviewStep = {
  key: string;
  label: string;
  state: ReviewStepState;
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
  const isTaxOfficer = role === 'TAX_OFFICER';
  const isRegistryOfficer = role === 'LAND_REGISTRY_OFFICER';
  const isApproval = role === 'APPROVAL_AUTHORITY';
  return {
    canAccept: role === 'RECEPTION_OFFICER' || isAdmin,
    canCommuneConfirm: role === 'COMMUNE_OFFICER' || isAdmin,
    canTaxTransfer: isRegistryOfficer || isAdmin,
    canConfirmPayment: isTaxOfficer || isAdmin,
    canApprove: isApproval || isAdmin,
    canReject: isRegistryOfficer || isApproval || isAdmin,
    canRequestSupplement:
      role === 'RECEPTION_OFFICER' || role === 'COMMUNE_OFFICER' || isRegistryOfficer || isTaxOfficer || isAdmin,
    canCadastralUpdate: isRegistryOfficer || isAdmin,
    canBlockchainSync: isRegistryOfficer || isApproval || isAdmin
  };
}
