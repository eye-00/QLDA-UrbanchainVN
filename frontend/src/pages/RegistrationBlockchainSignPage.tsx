import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import { getBlockchainResultStatusLabel, getServiceWalletRoleScopeLabel } from '../ui/domainLabels';
import {
  buildBlockchainSyncPayload,
  buildRegistrationBlockchainSigningMessage,
  canOpenBlockchainSign,
  canUseCitizenSyncMode,
  isExpectedChainId,
  isWalletAddressMatch,
  mapBlockchainSyncErrorMessage,
  type BlockchainSyncMode
} from './registrationBlockchainHelpers';

type RegistrationDetail = {
  id: string;
  code: string;
  status: string;
  cadastralUpdatedAt?: string | null;
  legalBasisCode?: string | null;
  landCode: string | null;
  tokenId: number | null;
  txHash: string | null;
  ipfsCid: string | null;
  documentHash: string | null;
  landInfo: {
    provinceCode: string;
    communeName: string;
    mapSheetNumber: string;
    parcelNumber: string;
    address: string;
  };
  ownerInfo: {
    fullName: string;
    identityNumber: string | null;
  };
  files: Array<{
    id: string;
    documentType: string;
    storageStatus: string;
    cid: string | null;
    hash: string | null;
    originalName: string;
  }>;
};

type CandidateResponse = {
  items: Array<{
    authorizationId: string;
    walletAddress: string;
    walletStatus: string;
    network: string;
    chainId: number;
    roleScope: string;
    effectiveTo: string | null;
    status: string;
  }>;
  total: number;
};

type WalletListResponse = {
  items: Array<{
    id: string;
    address: string;
    network: string;
    status: string;
    isDefault: boolean;
  }>;
  total: number;
};

type SyncResult = {
  registrationId: string;
  tokenId: number | null;
  txHash: string | null;
  status: string;
  syncMode: BlockchainSyncMode;
  chainId: number;
  contractAddress: string | null;
  explorerUrl: string | null;
  cid: string | null;
  metadataHash: string | null;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type SubmitState = 'IDLE' | 'PENDING' | 'CONFIRMED' | 'FAILED';

export function RegistrationBlockchainSignPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'REVIEW' | 'SIGN'>('REVIEW');
  const [loadError, setLoadError] = useState('');
  const [item, setItem] = useState<RegistrationDetail | null>(null);
  const [legalBasisCode, setLegalBasisCode] = useState('151/2025-ND-CP|3380/QD-BNNMT');
  const [cid, setCid] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [selectedAuthorizationId, setSelectedAuthorizationId] = useState('');
  const [candidateWallets, setCandidateWallets] = useState<CandidateResponse['items']>([]);
  const [citizenDefaultWalletAddress, setCitizenDefaultWalletAddress] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('IDLE');
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<SyncResult | null>(null);

  const expectedChainId = Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID ?? 11155111);
  const syncMode = useMemo<BlockchainSyncMode>(() => {
    if (canUseCitizenSyncMode(user?.role)) return 'CITIZEN_DIRECT_SIGN';
    return 'OFFICER_SERVICE_WALLET';
  }, [user?.role]);
  const isOfficerMode = syncMode === 'OFFICER_SERVICE_WALLET';

  const backPath = location.pathname.includes('/registrations/review/')
    ? `/registrations/review/${id}`
    : '/registrations/create';

  const loadRegistration = useCallback(async () => {
    if (!id) {
      setLoadError('Không tìm thấy mã hồ sơ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGet<RegistrationDetail>(`/registrations/${id}`);
      setItem(data);
      setLegalBasisCode(data.legalBasisCode ?? '151/2025-ND-CP|3380/QD-BNNMT');
      const firstFileWithMetadata = data.files.find((file) => file.cid && file.hash);
      setCid(data.ipfsCid ?? firstFileWithMetadata?.cid ?? '');
      setMetadataHash(data.documentHash ?? firstFileWithMetadata?.hash ?? '');
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadOfficerCandidates = useCallback(async () => {
    if (!id || !isOfficerMode) return;
    try {
      const data = await apiGet<CandidateResponse>(`/registrations/${id}/blockchain-sync/candidates`);
      setCandidateWallets(data.items);
      if (!selectedAuthorizationId && data.items.length > 0) {
        setSelectedAuthorizationId(data.items[0].authorizationId);
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách ví công vụ.');
    }
  }, [id, isOfficerMode, selectedAuthorizationId, showToast]);

  const loadCitizenWallet = useCallback(async () => {
    if (!canUseCitizenSyncMode(user?.role)) return;
    try {
      const data = await apiGet<WalletListResponse>('/wallets/me');
      const defaultWallet = data.items.find((wallet) => wallet.status === 'VERIFIED' && wallet.isDefault);
      setCitizenDefaultWalletAddress(defaultWallet?.address ?? '');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được ví mặc định đã xác minh.');
    }
  }, [showToast, user?.role]);

  useEffect(() => {
    void loadRegistration();
  }, [loadRegistration]);

  useEffect(() => {
    if (!item) return;
    if (isOfficerMode) {
      void loadOfficerCandidates();
      return;
    }
    void loadCitizenWallet();
  }, [item, isOfficerMode, loadCitizenWallet, loadOfficerCandidates]);

  function goBack() {
    navigate(backPath);
  }

  async function submitBlockchainSync() {
    if (!item) return;
    if (!legalBasisCode.trim()) {
      showToast('error', 'Vui lòng nhập căn cứ pháp lý trước khi ký.');
      return;
    }
    if (!cid.trim() || !metadataHash.trim()) {
      showToast('error', 'Vui lòng nhập đầy đủ CID và metadata hash.');
      return;
    }
    if (!window.ethereum) {
      showToast('error', 'Không tìm thấy ví trình duyệt. Hãy cài MetaMask hoặc ví EVM tương thích.');
      return;
    }
    if (isOfficerMode && !selectedAuthorizationId) {
      showToast('error', 'Vui lòng chọn ví công vụ trước khi ký.');
      return;
    }
    if (!canOpenBlockchainSign(item.status, item.cadastralUpdatedAt ?? null)) {
      showToast('error', 'Hồ sơ chưa đạt điều kiện cập nhật địa chính để ghi blockchain.');
      return;
    }

    setSubmitting(true);
    setSubmitState('PENDING');
    setSubmitError('');
    try {
      const accountsRaw = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = Array.isArray(accountsRaw) ? (accountsRaw as string[]) : [];
      const signerWalletAddress = accounts[0];
      if (!signerWalletAddress) {
        showToast('error', 'Không lấy được địa chỉ ví đang kết nối.');
        setSubmitState('FAILED');
        setSubmitError('Thiếu địa chỉ ví ký');
        return;
      }

      const chainIdRaw = await window.ethereum.request({ method: 'eth_chainId' });
      const signerChainId =
        typeof chainIdRaw === 'string' ? Number.parseInt(chainIdRaw, 16) : Number(chainIdRaw ?? 0);

      if (!isExpectedChainId(expectedChainId, signerChainId)) {
        const message = `WRONG_NETWORK: Chain hiện tại ${signerChainId} không khớp chain cấu hình ${expectedChainId}.`;
        showToast('error', mapBlockchainSyncErrorMessage(message));
        setSubmitState('FAILED');
        setSubmitError(message);
        return;
      }

      if (!isOfficerMode) {
        if (!citizenDefaultWalletAddress) {
          const message = 'WALLET_MISMATCH: Chưa có ví mặc định đã xác minh.';
          showToast('error', mapBlockchainSyncErrorMessage(message));
          setSubmitState('FAILED');
          setSubmitError(message);
          return;
        }
        if (!isWalletAddressMatch(citizenDefaultWalletAddress, signerWalletAddress)) {
          const message = 'WALLET_MISMATCH: Ví đang kết nối không trùng ví mặc định đã xác minh.';
          showToast('error', mapBlockchainSyncErrorMessage(message));
          setSubmitState('FAILED');
          setSubmitError(message);
          return;
        }
      }

      if (isOfficerMode) {
        const selected = candidateWallets.find((candidate) => candidate.authorizationId === selectedAuthorizationId);
        if (!selected) {
          showToast('error', 'Không tìm thấy ví công vụ đã chọn.');
          setSubmitState('FAILED');
          setSubmitError('walletAuthMissing: Không tìm thấy ví công vụ đã chọn');
          return;
        }
        if (!isWalletAddressMatch(selected.walletAddress, signerWalletAddress)) {
          const message = 'walletAuthMissing: Ví ký không trùng với ví công vụ đã chọn.';
          showToast('error', mapBlockchainSyncErrorMessage(message));
          setSubmitState('FAILED');
          setSubmitError(message);
          return;
        }
      }

      const signingMessage = buildRegistrationBlockchainSigningMessage({
        registrationCode: item.code,
        syncMode,
        signerAddress: signerWalletAddress,
        chainId: signerChainId,
        cid,
        metadataHash
      });

      const signatureRaw = await window.ethereum.request({
        method: 'personal_sign',
        params: [signingMessage, signerWalletAddress]
      });
      const signature = typeof signatureRaw === 'string' ? signatureRaw : '';
      if (!signature) {
        showToast('error', 'Không nhận được chữ ký từ ví.');
        setSubmitState('FAILED');
        setSubmitError('Không nhận được chữ ký');
        return;
      }

      const payload = buildBlockchainSyncPayload({
        legalBasisCode,
        syncMode,
        cid,
        metadataHash,
        signerWalletAddress,
        signerChainId,
        signingMessage,
        signature,
        walletAuthorizationId: isOfficerMode ? selectedAuthorizationId : undefined
      });

      const data = await apiPost<SyncResult>(`/registrations/${item.id}/blockchain-sync`, payload);
      setResult(data);
      setSubmitState('CONFIRMED');
      showToast('success', 'Đã ghi nhận giao dịch blockchain thành công.');
      await loadRegistration();
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Không gửi được giao dịch blockchain.';
      const mapped = mapBlockchainSyncErrorMessage(rawMessage);
      setSubmitState('FAILED');
      setSubmitError(rawMessage);
      showToast('error', mapped);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Ký và gửi blockchain</h2>
        <p className="section-subtitle">Đang tải dữ liệu hồ sơ...</p>
      </section>
    );
  }

  if (loadError || !item) {
    return (
      <section className="card row-gap">
        <h2>Ký và gửi blockchain</h2>
        <p className="error-notice">{loadError || 'Không tìm thấy hồ sơ.'}</p>
        <div className="action-row">
          <button type="button" className="btn btn-outline" onClick={goBack}>
            Quay lại
          </button>
        </div>
      </section>
    );
  }

  const canProceed = canOpenBlockchainSign(item.status, item.cadastralUpdatedAt ?? null);

  return (
    <section className="row-gap">
      <div className="section-header">
        <div>
          <h2>Ký và gửi blockchain {item.code}</h2>
          <p className="section-subtitle">Luồng 2 bước: kiểm tra nội dung giao dịch trước, sau đó ký và gửi.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goBack}>
          Quay lại hồ sơ
        </button>
      </div>

      <div className="card row-gap">
        <div className="action-row">
          <span className={`badge ${getRegistrationStatusBadgeClass(item.status)}`}>{getRegistrationStatusLabel(item.status)}</span>
          <span className="badge">{syncMode === 'OFFICER_SERVICE_WALLET' ? 'Luồng cán bộ' : 'Luồng công dân/doanh nghiệp'}</span>
          <span className={`badge ${canProceed ? 'badge-success' : 'badge-warning'}`}>
            {canProceed ? 'Đủ điều kiện ký blockchain' : 'Chưa đủ điều kiện ký blockchain'}
          </span>
        </div>

        <div className="timeline-track">
          <div className="timeline-step">
            <span className={`timeline-dot ${step === 'REVIEW' ? 'timeline-dot-current' : 'timeline-dot-done'}`}>
              {step === 'REVIEW' ? '1' : '✓'}
            </span>
            <span className={`timeline-label ${step === 'REVIEW' ? 'timeline-label-current' : ''}`}>Bước 1: Xem lại</span>
          </div>
          <div className="timeline-step">
            <span className={`timeline-dot ${step === 'SIGN' ? 'timeline-dot-current' : 'timeline-dot-todo'}`}>
              {step === 'SIGN' ? '2' : ''}
            </span>
            <span className={`timeline-label ${step === 'SIGN' ? 'timeline-label-current' : ''}`}>Bước 2: Ký và gửi</span>
          </div>
        </div>

        {step === 'REVIEW' ? (
          <div className="row-gap">
            <div className="split-grid">
              <div className="row-gap">
                <h3>Thông tin giao dịch</h3>
                <div>Loại giao dịch: Đồng bộ metadata hồ sơ đăng ký lên blockchain</div>
                <div>Mã hồ sơ: {item.code}</div>
                <div>Mã thửa nghiệp vụ: {item.landCode ?? 'Chưa có'}</div>
                <div>Chủ sử dụng: {item.ownerInfo.fullName}</div>
                <div>Vị trí: {item.landInfo.provinceCode} / {item.landInfo.communeName}</div>
              </div>
              <div className="row-gap">
                <h3>Thông số ký</h3>
                <div>Network: {import.meta.env.VITE_BLOCKCHAIN_NETWORK ?? 'SEPOLIA'}</div>
                <div>Chain ID: {expectedChainId}</div>
                <div>Căn cứ pháp lý:</div>
                <input value={legalBasisCode} onChange={(event) => setLegalBasisCode(event.target.value)} />
              </div>
            </div>

            <div className="form-grid">
              <label>
                CID IPFS
                <input value={cid} onChange={(event) => setCid(event.target.value)} placeholder="bafy..." />
              </label>
              <label>
                Metadata hash
                <input value={metadataHash} onChange={(event) => setMetadataHash(event.target.value)} placeholder="0x..." />
              </label>
            </div>

            <div className="action-row">
              <button type="button" onClick={() => setStep('SIGN')} disabled={!canProceed}>
                Tiếp tục bước ký
              </button>
            </div>
          </div>
        ) : (
          <div className="row-gap">
            {isOfficerMode ? (
              <label>
                Ví công vụ được cấp quyền
                <select
                  value={selectedAuthorizationId}
                  onChange={(event) => setSelectedAuthorizationId(event.target.value)}
                  disabled={submitting}
                >
                  {candidateWallets.length === 0 ? (
                    <option value="">Không có ví công vụ đủ điều kiện</option>
                  ) : null}
                  {candidateWallets.map((candidate) => (
                    <option key={candidate.authorizationId} value={candidate.authorizationId}>
                      {candidate.walletAddress} ({candidate.network}/{candidate.chainId}) - {getServiceWalletRoleScopeLabel(candidate.roleScope)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="notice">
                <strong>Ví mặc định đã xác minh</strong>
                <div>{citizenDefaultWalletAddress || 'Chưa có ví mặc định đã xác minh'}</div>
              </div>
            )}

            <div className="action-row">
              <button type="button" onClick={() => void submitBlockchainSync()} disabled={submitting || !canProceed}>
                {submitting ? 'Đang ký và gửi...' : 'Ký và gửi blockchain'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setStep('REVIEW')} disabled={submitting}>
                Quay lại bước xem
              </button>
            </div>

            {submitState === 'PENDING' && <div className="notice">Giao dịch đang được gửi. Vui lòng đợi phản hồi từ hệ thống.</div>}
            {submitState === 'FAILED' && (
              <div className="error-notice">
                {mapBlockchainSyncErrorMessage(submitError || 'Không gửi được giao dịch blockchain.')}
              </div>
            )}
            {submitState === 'CONFIRMED' && result ? (
              <div className="notice row-gap">
                <strong>Đồng bộ blockchain thành công</strong>
                <div>Tx hash: {result.txHash ?? 'Chưa có'}</div>
                <div>Token ID: {result.tokenId ?? 'Chưa có'}</div>
                <div>Chain ID: {result.chainId}</div>
                <div>Contract: {result.contractAddress ?? 'Chưa có'}</div>
                <div>CID: {result.cid ?? 'Chưa có'}</div>
                <div>Metadata hash: {result.metadataHash ?? 'Chưa có'}</div>
                <div>Trạng thái: {getBlockchainResultStatusLabel(result.status)}</div>
                {result.explorerUrl ? (
                  <a href={result.explorerUrl} target="_blank" rel="noreferrer">
                    Mở giao dịch trên explorer
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
