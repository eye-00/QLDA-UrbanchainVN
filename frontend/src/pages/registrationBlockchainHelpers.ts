import { UserRole } from '../auth/roles';

const BLOCKCHAIN_STATUS_VIEWER_ROLES: UserRole[] = [
  'LAND_REGISTRY_OFFICER',
  'APPROVAL_AUTHORITY',
  'AUDITOR',
  'ADMIN'
];

export function canViewBlockchainStatus(role: UserRole | undefined) {
  return Boolean(role && BLOCKCHAIN_STATUS_VIEWER_ROLES.includes(role));
}

export function formatShortTxHash(txHash: string | null | undefined) {
  if (!txHash || txHash.length < 16) return txHash ?? null;
  return `${txHash.slice(0, 14)}...${txHash.slice(-6)}`;
}

export function resolveBlockchainSyncBadge(inSync: boolean, offChainLinked: boolean, onChainLinked: boolean) {
  if (inSync) {
    return {
      className: 'badge-success',
      label: 'Đồng bộ'
    };
  }

  if (offChainLinked && !onChainLinked) {
    return {
      className: 'badge-warning',
      label: 'Thiếu bản ghi on-chain'
    };
  }

  if (!offChainLinked && onChainLinked) {
    return {
      className: 'badge-danger',
      label: 'Lệch với dữ liệu off-chain'
    };
  }

  return {
    className: 'badge-warning',
    label: 'Chưa liên kết'
  };
}
