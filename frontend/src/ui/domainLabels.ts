import { DOCUMENT_TYPE_OPTIONS } from '../lib/files';

const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>;

const FILE_STORAGE_STATUS_LABELS: Record<string, string> = {
  UPLOADED_IPFS: 'Đã tải lên IPFS',
  FAILED: 'Lỗi tải tệp',
  PENDING: 'Đang xử lý'
};

const PAYMENT_OBLIGATION_TYPE_LABELS: Record<string, string> = {
  INTAKE_FEE: 'Lệ phí tiếp nhận',
  LAND_FINANCIAL_OBLIGATION: 'Nghĩa vụ tài chính đất đai'
};

const PAYMENT_OBLIGATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy'
};

const BLOCKCHAIN_RESULT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang xử lý',
  CONFIRMED: 'Đã xác nhận',
  FAILED: 'Thất bại',
  REJECTED: 'Đã từ chối'
};

const SERVICE_WALLET_ROLE_SCOPE_LABELS: Record<string, string> = {
  LAND_REGISTRY_OFFICER: 'Cán bộ VPĐKĐĐ',
  APPROVAL_AUTHORITY: 'Cơ quan phê duyệt'
};

export function getDocumentTypeLabel(documentType: string | null | undefined) {
  if (!documentType) return 'Chưa xác định';
  return DOCUMENT_TYPE_LABELS[documentType] ?? 'Giấy tờ bổ sung';
}

export function getFileStorageStatusLabel(storageStatus: string | null | undefined) {
  if (!storageStatus) return 'Chưa xác định';
  return FILE_STORAGE_STATUS_LABELS[storageStatus] ?? 'Trạng thái khác';
}

export function getPaymentObligationTypeLabel(type: string | null | undefined) {
  if (!type) return 'Chưa xác định';
  return PAYMENT_OBLIGATION_TYPE_LABELS[type] ?? 'Nghĩa vụ khác';
}

export function getPaymentObligationStatusLabel(status: string | null | undefined) {
  if (!status) return 'Chưa xác định';
  return PAYMENT_OBLIGATION_STATUS_LABELS[status] ?? 'Trạng thái khác';
}

export function getBlockchainResultStatusLabel(status: string | null | undefined) {
  if (!status) return 'Chưa xác định';
  return BLOCKCHAIN_RESULT_STATUS_LABELS[status] ?? 'Kết quả khác';
}

export function getServiceWalletRoleScopeLabel(roleScope: string | null | undefined) {
  if (!roleScope) return 'Chưa xác định';
  return SERVICE_WALLET_ROLE_SCOPE_LABELS[roleScope] ?? 'Vai trò khác';
}
