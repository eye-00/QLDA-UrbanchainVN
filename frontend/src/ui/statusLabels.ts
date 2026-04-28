export type AccountStatusCode = 'ACTIVE' | 'LOCKED' | 'INACTIVE';

const ACCOUNT_STATUS_LABELS: Record<AccountStatusCode, string> = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khóa',
  INACTIVE: 'Ngừng hoạt động'
};

export function getAccountStatusLabel(status: AccountStatusCode | string) {
  return ACCOUNT_STATUS_LABELS[status as AccountStatusCode] ?? status;
}
