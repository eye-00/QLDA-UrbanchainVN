import { UserRole } from '../auth/roles';

const BLOCKCHAIN_STATUS_VIEWER_ROLES: UserRole[] = [
  'LAND_REGISTRY_OFFICER',
  'APPROVAL_AUTHORITY',
  'AUDITOR',
  'ADMIN'
];

const OFFICER_SYNC_ROLES: UserRole[] = ['LAND_REGISTRY_OFFICER', 'APPROVAL_AUTHORITY'];
const CITIZEN_SYNC_ROLES: UserRole[] = ['CITIZEN', 'BUSINESS'];

export type BlockchainSyncMode = 'OFFICER_SERVICE_WALLET' | 'CITIZEN_DIRECT_SIGN';

type BlockchainSyncPayloadInput = {
  legalBasisCode: string;
  syncMode: BlockchainSyncMode;
  cid: string;
  metadataHash: string;
  signerWalletAddress: string;
  signerChainId: number;
  signingMessage: string;
  signature: string;
  walletAuthorizationId?: string;
};

export function canViewBlockchainStatus(role: UserRole | undefined) {
  return Boolean(role && BLOCKCHAIN_STATUS_VIEWER_ROLES.includes(role));
}

export function canUseOfficerSyncMode(role: UserRole | undefined) {
  return Boolean(role && OFFICER_SYNC_ROLES.includes(role));
}

export function canUseCitizenSyncMode(role: UserRole | undefined) {
  return Boolean(role && CITIZEN_SYNC_ROLES.includes(role));
}

export function canOpenBlockchainSign(status: string, cadastralUpdatedAt?: string | null) {
  return status === 'DA_CAP_NHAT_HO_SO_DIA_CHINH' || (status === 'DA_CAP' && Boolean(cadastralUpdatedAt));
}

export function normalizeWalletAddress(address: string | null | undefined) {
  return (address ?? '').trim().toLowerCase();
}

export function isWalletAddressMatch(expectedAddress: string | null | undefined, actualAddress: string | null | undefined) {
  const expected = normalizeWalletAddress(expectedAddress);
  const actual = normalizeWalletAddress(actualAddress);
  return Boolean(expected && actual && expected === actual);
}

export function isExpectedChainId(expected: number, actual: number) {
  return expected > 0 && actual > 0 && expected === actual;
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

export function buildRegistrationBlockchainSigningMessage(input: {
  registrationCode: string;
  syncMode: BlockchainSyncMode;
  signerAddress: string;
  chainId: number;
  cid: string;
  metadataHash: string;
}) {
  return [
    'UrbanChain-VN Blockchain Sync Confirmation',
    `RegistrationCode: ${input.registrationCode}`,
    `SyncMode: ${input.syncMode}`,
    `Signer: ${input.signerAddress}`,
    `ChainId: ${input.chainId}`,
    `CID: ${input.cid}`,
    `MetadataHash: ${input.metadataHash}`,
    `IssuedAt: ${new Date().toISOString()}`
  ].join('\n');
}

export function buildBlockchainSyncPayload(input: BlockchainSyncPayloadInput) {
  const payload: Record<string, unknown> = {
    legalBasisCode: input.legalBasisCode,
    syncMode: input.syncMode,
    cid: input.cid,
    metadataHash: input.metadataHash,
    signerWalletAddress: input.signerWalletAddress,
    signerChainId: input.signerChainId,
    signingMessage: input.signingMessage,
    signature: input.signature
  };

  if (input.syncMode === 'OFFICER_SERVICE_WALLET' && input.walletAuthorizationId) {
    payload.walletAuthorizationId = input.walletAuthorizationId;
  }

  return payload;
}

export function mapBlockchainSyncErrorMessage(message: string) {
  const normalized = message.toUpperCase();

  if (normalized.includes('WALLETAUTHMISSING')) {
    return 'Ví công vụ chưa hợp lệ hoặc bạn chưa được cấp quyền ký blockchain.';
  }
  if (normalized.includes('WALLET_MISMATCH')) {
    return 'Ví đang kết nối không trùng ví đã xác minh/mặc định. Vui lòng đổi đúng ví rồi thử lại.';
  }
  if (normalized.includes('WRONG_NETWORK')) {
    return 'Bạn đang ở sai mạng blockchain. Hãy chuyển đúng chain rồi thử lại.';
  }
  if (normalized.includes('STATUS_NOT_READY') || normalized.includes('ĐIỀU KIỆN OFF-CHAIN')) {
    return 'Hồ sơ chưa đạt điều kiện cập nhật địa chính off-chain để ghi blockchain.';
  }
  if (normalized.includes('OWNERSHIP_DENIED')) {
    return 'Bạn không có quyền ký blockchain cho hồ sơ này.';
  }
  if (normalized.includes('USER DENIED') || normalized.includes('REJECTED')) {
    return 'Bạn đã từ chối ký giao dịch trên ví. Có thể thử lại khi sẵn sàng.';
  }

  return message;
}
