import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import {
  buildRegistrationReviewQuery,
  getReviewPermissions,
  getReviewStepsByStatus,
  isBlockchainSyncReady,
  isTaxTransferReady,
  requiresActionNote
} from './registrationReviewHelpers';
import { canViewBlockchainStatus, formatShortTxHash, resolveBlockchainSyncBadge } from './registrationBlockchainHelpers';

type RegistrationItem = {
  id: string;
  code: string;
  applicantId: string;
  status: string;
  tokenId?: number | null;
  txHash?: string | null;
  landCode?: string | null;
  procedureCode?: string | null;
  legalBasisCode?: string | null;
  landInfo: {
    provinceCode: string;
    communeName: string;
    parcelNumber: string;
    mapSheetNumber: string;
    area: number;
    landUsePurpose: string;
    address: string;
  };
  ownerInfo: {
    ownerType: string;
    fullName: string;
    identityNumber: string | null;
    address: string | null;
  };
  notes: string[];
  files?: Array<{
    id: string;
    documentType: string;
    originalName: string;
    cid: string | null;
    hash: string | null;
  }>;
  updatedAt: string;
};

type RegistrationListResponse = {
  items: RegistrationItem[];
  total: number;
};

type PaymentObligationItem = {
  id: string;
  type: 'INTAKE_FEE' | 'LAND_FINANCIAL_OBLIGATION';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  legalBasisCode: string;
  referenceNo: string | null;
  amount: number | null;
  note: string | null;
};

type PaymentObligationListResponse = {
  items: PaymentObligationItem[];
  total: number;
};

type DocumentHistoryEvent = {
  id: string;
  type: 'DOCUMENT_VERSION' | 'SUBMIT_SNAPSHOT' | 'STATUS_AUDIT';
  at: string;
  title: string;
  detail: Record<string, unknown>;
};

type DocumentHistoryResponse = {
  items: DocumentHistoryEvent[];
  total: number;
};

type BlockchainLookupPayload = {
  mode: 'mock' | 'rpc';
  contractAddress: string | null;
  registrationTokenId: number | null;
  landTokenId: number | null;
};

type BlockchainStatusPayload = {
  registrationId: string;
  registrationCode: string;
  landCode: string;
  offChain: {
    status: string;
    tokenId: number | null;
    txHash: string | null;
  };
  onChain: BlockchainLookupPayload;
  inSync: boolean;
};

const STATUS_FILTER_OPTIONS = [
  'CHO_TIEP_NHAN',
  'CAN_BO_SUNG',
  'DA_TIEP_NHAN',
  'CHO_XAC_NHAN_CAP_XA',
  'DA_XAC_NHAN_CAP_XA',
  'DANG_THAM_DINH_VPDKDD',
  'CHO_THUE',
  'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH',
  'DA_HOAN_THANH_NGHIA_VU_TAI_CHINH',
  'CHO_KY_CAP',
  'DA_KY_CAP',
  'DA_CAP_NHAT_HO_SO_DIA_CHINH',
  'DA_GHI_BLOCKCHAIN',
  'DA_CAP',
  'DA_TRA_KET_QUA',
  'TU_CHOI'
];

const initialFilters = {
  keyword: '',
  status: ''
};

export function RegistrationReviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [actionNote, setActionNote] = useState('');
  const [taxReferenceNo, setTaxReferenceNo] = useState('');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [chainCid, setChainCid] = useState('');
  const [chainHash, setChainHash] = useState('');
  const [legalBasisCode, setLegalBasisCode] = useState('');
  const [paymentObligations, setPaymentObligations] = useState<PaymentObligationItem[]>([]);
  const [documentHistory, setDocumentHistory] = useState<DocumentHistoryEvent[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatusPayload | null>(null);
  const [loadingBlockchainStatus, setLoadingBlockchainStatus] = useState(false);
  const [missingItemsInput, setMissingItemsInput] = useState('');
  const [supplementDeadline, setSupplementDeadline] = useState('');
  const [communeEvidenceFileId, setCommuneEvidenceFileId] = useState('');

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);
  const queryString = useMemo(() => buildRegistrationReviewQuery(filters), [filters]);
  const permissions = useMemo(() => getReviewPermissions(user?.role), [user?.role]);
  const blockchainStatusEnabled = useMemo(() => canViewBlockchainStatus(user?.role), [user?.role]);
  const reviewSteps = useMemo(
    () => (selected ? getReviewStepsByStatus(selected.status) : []),
    [selected]
  );

  async function loadRegistrations() {
    setLoading(true);
    try {
      const path = queryString ? `/registrations?${queryString}` : '/registrations?pageSize=50';
      const data = await apiGet<RegistrationListResponse>(path);
      setItems(data.items);
      if (!selectedId && data.items.length > 0) setSelectedId(data.items[0].id);
      if (selectedId && data.items.every((item) => item.id !== selectedId)) {
        setSelectedId(data.items[0]?.id ?? null);
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách hồ sơ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRegistrations();
  }, []);

  useEffect(() => {
    if (!selected) {
      setPaymentObligations([]);
      setDocumentHistory([]);
      setBlockchainStatus(null);
      setCommuneEvidenceFileId('');
      return;
    }
    setLegalBasisCode(selected.legalBasisCode ?? selected.procedureCode ?? '');
    setCommuneEvidenceFileId(selected.files?.[0]?.id ?? '');
    void loadPaymentObligations(selected.id);
    void loadDocumentHistory(selected.id);
    if (blockchainStatusEnabled) {
      void loadBlockchainStatus(selected.id);
    } else {
      setBlockchainStatus(null);
    }
  }, [selected?.id, blockchainStatusEnabled]);

  async function loadPaymentObligations(registrationId: string) {
    try {
      const data = await apiGet<PaymentObligationListResponse>(`/registrations/${registrationId}/payment-obligations`);
      setPaymentObligations(data.items);
    } catch {
      setPaymentObligations([]);
    }
  }

  async function loadDocumentHistory(registrationId: string) {
    try {
      const data = await apiGet<DocumentHistoryResponse>(`/registrations/${registrationId}/document-history`);
      setDocumentHistory(data.items);
    } catch {
      setDocumentHistory([]);
    }
  }

  async function loadBlockchainStatus(registrationId: string) {
    if (!blockchainStatusEnabled) return;
    setLoadingBlockchainStatus(true);
    try {
      const data = await apiGet<BlockchainStatusPayload>(`/registrations/${registrationId}/blockchain-status`);
      setBlockchainStatus(data);
    } catch (error) {
      setBlockchainStatus(null);
      showToast('error', error instanceof Error ? error.message : 'Không đối soát được trạng thái on-chain/off-chain.');
    } finally {
      setLoadingBlockchainStatus(false);
    }
  }

  function resolveLegalBasisCode() {
    const value = legalBasisCode.trim();
    if (value) return value;
    if (selected?.procedureCode) return selected.procedureCode;
    return `LEGAL-${Date.now()}`;
  }

  async function executeAction(path: string, body: Record<string, unknown>, successMessage: string) {
    if (!selected) return;
    setLoading(true);
    try {
      const payload = {
        ...body,
        legalBasisCode: typeof body.legalBasisCode === 'string' ? body.legalBasisCode : resolveLegalBasisCode()
      };
      await apiPost(`/registrations/${selected.id}${path}`, payload);
      showToast('success', successMessage);
      setActionNote('');
      setTaxReferenceNo('');
      setApprovalNumber('');
      setChainCid('');
      setChainHash('');
      setMissingItemsInput('');
      setSupplementDeadline('');
      await loadRegistrations();
      await loadPaymentObligations(selected.id);
      await loadDocumentHistory(selected.id);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thực hiện được thao tác.');
    } finally {
      setLoading(false);
    }
  }

  function requireNoteFor(actionLabel: string) {
    if (requiresActionNote('supplement', actionNote)) return true;
    showToast('error', `Vui lòng nhập ghi chú để ${actionLabel.toLowerCase()}.`);
    return false;
  }

  function parseMissingItems() {
    return missingItemsInput
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  function toIsoDeadline(value: string) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString();
  }

  return (
    <section className="toolbar-row">
      <div className="section-header">
        <div>
          <h2>Danh sách hồ sơ chờ xử lý</h2>
          <p className="section-subtitle">
            Lọc, mở chi tiết và cập nhật trạng thái hồ sơ đăng ký lần đầu theo vai trò xử lý.
          </p>
        </div>
        <button type="button" onClick={() => void loadRegistrations()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="card form-grid-4">
        <label>
          Từ khóa
          <input
            value={filters.keyword}
            placeholder="Mã hồ sơ, chủ sử dụng, số thửa..."
            onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
          />
        </label>
        <label>
          Trạng thái
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getRegistrationStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <div className="action-row">
          <button type="button" onClick={() => void loadRegistrations()} disabled={loading}>
            Áp dụng bộ lọc
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setFilters(initialFilters)} disabled={loading}>
            Xóa lọc
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Không có hồ sơ phù hợp điều kiện lọc hiện tại.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Chủ sử dụng</th>
                  <th>Vị trí thửa đất</th>
                  <th>Trạng thái</th>
                  <th>Blockchain</th>
                  <th>Cập nhật</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.ownerInfo.fullName}</td>
                    <td>{item.landInfo.provinceCode} / {item.landInfo.communeName}</td>
                    <td>
                      <span className={`badge ${getRegistrationStatusBadgeClass(item.status)}`}>
                        {getRegistrationStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      {item.txHash ? (
                        <div className="row-gap-xs">
                          <div className="mono-text">{formatShortTxHash(item.txHash)}</div>
                          <div className="muted">Token #{item.tokenId ?? 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="muted">Chưa ghi chain</span>
                      )}
                    </td>
                    <td>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <button type="button" className="btn btn-outline" onClick={() => setSelectedId(item.id)}>
                        Mở hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="card row-gap">
          <div className="card-title-row">
            <div>
              <strong>Chi tiết hồ sơ: {selected.code}</strong>
              <p className="section-subtitle">Người nộp: {selected.applicantId}</p>
            </div>
            <div className="action-row">
              <span className={`badge ${getRegistrationStatusBadgeClass(selected.status)}`}>
                {getRegistrationStatusLabel(selected.status)}
              </span>
              <span className="badge">Cập nhật: {new Date(selected.updatedAt).toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <div className="timeline-track">
            {reviewSteps.map((step) => (
              <div className="timeline-step" key={step.key}>
                <span className={`timeline-dot timeline-dot-${step.state}`}>
                  {step.state === 'done' ? '✓' : ''}
                </span>
                <span className={`timeline-label timeline-label-${step.state}`}>{step.label}</span>
              </div>
            ))}
          </div>

          <div className="split-grid">
            <div className="row-gap">
              <h3>Thông tin thửa đất</h3>
              <div>Tỉnh/Thành phố: {selected.landInfo.provinceCode}</div>
              <div>Xã/Phường/Đặc khu: {selected.landInfo.communeName}</div>
              <div>Số tờ / Số thửa: {selected.landInfo.mapSheetNumber} / {selected.landInfo.parcelNumber}</div>
              <div>Diện tích: {selected.landInfo.area} m²</div>
              <div>Mục đích sử dụng: {selected.landInfo.landUsePurpose}</div>
              <div>Địa chỉ: {selected.landInfo.address}</div>
            </div>
            <div className="row-gap">
              <h3>Thông tin chủ sử dụng</h3>
              <div>Họ tên: {selected.ownerInfo.fullName}</div>
              <div>Số định danh: {selected.ownerInfo.identityNumber ?? 'Chưa khai báo'}</div>
              <div>Địa chỉ: {selected.ownerInfo.address ?? 'Chưa khai báo'}</div>
              <div>Người nộp hồ sơ: {selected.applicantId}</div>
            </div>
          </div>

          <div className="row-gap">
            <h3>Lịch sử ghi chú</h3>
            {selected.notes.length === 0 ? (
              <div className="empty-state">Chưa có ghi chú xử lý.</div>
            ) : (
              <ul className="note-list">
                {selected.notes.map((note, index) => (
                  <li key={`${selected.id}-${index}`}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="row-gap">
            <h3>Lịch sử phiên bản tài liệu</h3>
            {documentHistory.length === 0 ? (
              <div className="empty-state">Chưa có timeline tài liệu.</div>
            ) : (
              <ul className="note-list">
                {documentHistory.map((event) => (
                  <li key={event.id}>
                    <strong>{event.title}</strong> - {new Date(event.at).toLocaleString('vi-VN')}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {blockchainStatusEnabled && (
            <div className="row-gap">
              <div className="card-title-row">
                <h3>Đối soát on-chain/off-chain</h3>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => selected && void loadBlockchainStatus(selected.id)}
                  disabled={loadingBlockchainStatus}
                >
                  {loadingBlockchainStatus ? 'Đang đối soát...' : 'Đối soát lại'}
                </button>
              </div>
              {!blockchainStatus ? (
                <div className="empty-state">Chưa có dữ liệu đối soát blockchain.</div>
              ) : (
                <div className="onchain-status-grid">
                  <div className="metric-item">
                    <span>Độ đồng bộ</span>
                    <strong>
                      <span
                        className={`badge ${resolveBlockchainSyncBadge(
                          blockchainStatus.inSync,
                          Boolean(blockchainStatus.offChain.txHash || blockchainStatus.offChain.tokenId),
                          Boolean(
                            blockchainStatus.onChain.registrationTokenId || blockchainStatus.onChain.landTokenId
                          )
                        ).className}`}
                      >
                        {
                          resolveBlockchainSyncBadge(
                            blockchainStatus.inSync,
                            Boolean(blockchainStatus.offChain.txHash || blockchainStatus.offChain.tokenId),
                            Boolean(blockchainStatus.onChain.registrationTokenId || blockchainStatus.onChain.landTokenId)
                          ).label
                        }
                      </span>
                    </strong>
                  </div>
                  <div className="metric-item">
                    <span>Mã thửa dùng để ghi chain</span>
                    <strong className="mono-text">{blockchainStatus.landCode}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Token hồ sơ (off-chain)</span>
                    <strong>{blockchainStatus.offChain.tokenId ?? 'Chưa có'}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Token hồ sơ (on-chain)</span>
                    <strong>{blockchainStatus.onChain.registrationTokenId ?? 'Chưa có'}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Token thửa đất (on-chain)</span>
                    <strong>{blockchainStatus.onChain.landTokenId ?? 'Chưa có'}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Tx hash (off-chain)</span>
                    <strong className="mono-text">{formatShortTxHash(blockchainStatus.offChain.txHash) ?? 'Chưa có'}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Địa chỉ contract</span>
                    <strong className="mono-text">{blockchainStatus.onChain.contractAddress ?? 'Mock mode'}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Nguồn kiểm tra</span>
                    <strong>{blockchainStatus.onChain.mode === 'rpc' ? 'RPC node' : 'Mock blockchain'}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="row-gap">
            <h3>Thao tác xử lý</h3>
            <label>
              Căn cứ pháp lý
              <input
                value={legalBasisCode}
                onChange={(event) => setLegalBasisCode(event.target.value)}
                placeholder="VD: QĐ3380-2025-UBND"
              />
            </label>
            <label>
              Ghi chú xử lý
              <input
                value={actionNote}
                onChange={(event) => setActionNote(event.target.value)}
                placeholder="Nhập ghi chú hoặc lý do xử lý..."
              />
            </label>
            <label>
              Chứng cứ xác nhận cấp xã
              <select value={communeEvidenceFileId} onChange={(event) => setCommuneEvidenceFileId(event.target.value)}>
                <option value="">Chọn tệp chứng cứ</option>
                {(selected.files ?? []).map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.documentType} - {file.originalName}
                  </option>
                ))}
              </select>
            </label>

            <div className="action-row">
              {permissions.canAccept && (
                <button type="button" onClick={() => void executeAction('/accept', { note: actionNote || undefined }, 'Đã tiếp nhận hồ sơ.')}>
                  Tiếp nhận
                </button>
              )}
              {permissions.canRequestSupplement && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    if (!requireNoteFor('yêu cầu bổ sung')) return;
                    const missingItems = parseMissingItems();
                    if (missingItems.length === 0) {
                      showToast('error', 'Vui lòng nhập danh mục thiếu (mỗi dòng một mục).');
                      return;
                    }
                    const deadlineAt = toIsoDeadline(supplementDeadline);
                    if (!deadlineAt) {
                      showToast('error', 'Vui lòng nhập hạn bổ sung hợp lệ.');
                      return;
                    }
                    void executeAction(
                      '/request-supplement',
                      { note: actionNote, missingItems, deadlineAt },
                      'Đã yêu cầu bổ sung hồ sơ.'
                    );
                  }}
                >
                  Yêu cầu bổ sung
                </button>
              )}
              {permissions.canReject && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    if (!requireNoteFor('từ chối hồ sơ')) return;
                    void executeAction('/reject', { note: actionNote }, 'Đã từ chối hồ sơ.');
                  }}
                >
                  Từ chối
                </button>
              )}
            </div>

            {permissions.canCommuneConfirm && (
              <div className="action-row">
                <button
                  type="button"
                  onClick={() => {
                    if (!requireNoteFor('xác nhận cấp xã')) return;
                    if (!communeEvidenceFileId) {
                      showToast('error', 'Vui lòng chọn tệp chứng cứ cho xác nhận cấp xã.');
                      return;
                    }
                    void executeAction(
                      '/commune-confirm',
                      { confirmed: true, notes: actionNote, evidenceFileId: communeEvidenceFileId },
                      'Đã xác nhận cấp xã.'
                    );
                  }}
                >
                  Xác nhận cấp xã
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    if (!requireNoteFor('trả hồ sơ bổ sung từ cấp xã')) return;
                    if (!communeEvidenceFileId) {
                      showToast('error', 'Vui lòng chọn tệp chứng cứ cho bước xác nhận cấp xã.');
                      return;
                    }
                    void executeAction(
                      '/commune-confirm',
                      { confirmed: false, notes: actionNote, evidenceFileId: communeEvidenceFileId },
                      'Đã trả hồ sơ bổ sung từ cấp xã.'
                    );
                  }}
                >
                  Trả bổ sung
                </button>
              </div>
            )}

            <div className="form-grid">
              <label>
                Danh mục thiếu (mỗi dòng một mục)
                <textarea
                  value={missingItemsInput}
                  onChange={(event) => setMissingItemsInput(event.target.value)}
                  placeholder="Ví dụ:\nThiếu bản scan giấy tờ nguồn gốc đất\nThiếu minh chứng nghĩa vụ tài chính"
                  rows={3}
                />
              </label>
              <label>
                Hạn bổ sung
                <input
                  type="datetime-local"
                  value={supplementDeadline}
                  onChange={(event) => setSupplementDeadline(event.target.value)}
                />
              </label>
            </div>

            {permissions.canTaxTransfer && (
              <div className="form-grid">
                <label>
                  Mã chuyển thuế
                  <input
                    value={taxReferenceNo}
                    onChange={(event) => setTaxReferenceNo(event.target.value)}
                    placeholder="VD: TAX-2026-001"
                  />
                </label>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isTaxTransferReady(taxReferenceNo)) {
                        showToast('error', 'Vui lòng nhập mã chuyển thuế trước khi thực hiện.');
                        return;
                      }
                      void executeAction('/tax-transfer', { taxReferenceNo, notes: actionNote || undefined }, 'Đã chuyển thông tin nghĩa vụ tài chính.');
                    }}
                  >
                    Chuyển thuế
                  </button>
                </div>
              </div>
            )}

            {permissions.canConfirmPayment && (
              <div className="row-gap">
                <h4>Ghi nhận nghĩa vụ tài chính</h4>
                {paymentObligations.length === 0 ? (
                  <div className="empty-state">Chưa có nghĩa vụ tài chính cần xử lý.</div>
                ) : (
                  <div className="action-stack">
                    {paymentObligations.map((item) => (
                      <div key={item.id} className="action-row action-row-spread">
                        <div>
                          <strong>{item.type === 'INTAKE_FEE' ? 'Phí tiếp nhận' : 'Nghĩa vụ tài chính đất đai'}</strong>
                          <div className="muted">
                            {item.referenceNo ?? 'Chưa có mã tham chiếu'} - {item.amount ? `${item.amount.toLocaleString('vi-VN')} đ` : 'Chưa có số tiền'}
                          </div>
                        </div>
                        <div className="action-row">
                          <span className={`badge ${item.status === 'CONFIRMED' ? 'badge-success' : item.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                            {item.status === 'PENDING' ? 'Đang chờ' : item.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã hủy'}
                          </span>
                          {item.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!selected) return;
                                setLoading(true);
                                try {
                                  await apiPatch(`/registrations/${selected.id}/payment-obligations/${item.id}/status`, {
                                    status: 'CONFIRMED',
                                    legalBasisCode: resolveLegalBasisCode(),
                                    note: actionNote || undefined
                                  });
                                  showToast('success', 'Đã xác nhận hoàn thành nghĩa vụ tài chính.');
                                  await loadRegistrations();
                                  await loadPaymentObligations(selected.id);
                                } catch (error) {
                                  showToast('error', error instanceof Error ? error.message : 'Không xác nhận được nghĩa vụ tài chính.');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                            >
                              Xác nhận hoàn thành
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {permissions.canApprove && (
              <div className="form-grid">
                <label>
                  Số quyết định phê duyệt
                  <input
                    value={approvalNumber}
                    onChange={(event) => setApprovalNumber(event.target.value)}
                    placeholder="VD: QD-2026-123"
                  />
                </label>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() =>
                      void executeAction(
                        '/approve',
                        {
                          approvalNumber: approvalNumber || undefined,
                          approvalDate: new Date().toISOString().slice(0, 10),
                          note: actionNote || undefined
                        },
                        'Đã phê duyệt hồ sơ.'
                      )
                    }
                  >
                    Phê duyệt
                  </button>
                </div>
              </div>
            )}

            {permissions.canBlockchainSync && (
              <div className="form-grid">
                <label>
                  CID IPFS
                  <input value={chainCid} onChange={(event) => setChainCid(event.target.value)} placeholder="bafy..." />
                </label>
                <label>
                  Metadata hash
                  <input value={chainHash} onChange={(event) => setChainHash(event.target.value)} placeholder="0x..." />
                </label>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isBlockchainSyncReady(chainCid, chainHash)) {
                        showToast('error', 'Vui lòng nhập đầy đủ CID và metadata hash.');
                        return;
                      }
                      void executeAction(
                        '/blockchain-sync',
                        {
                          cid: chainCid,
                          metadataHash: chainHash
                        },
                        'Đã đồng bộ bản ghi số.'
                      );
                    }}
                  >
                    Đồng bộ blockchain
                  </button>
                </div>
              </div>
            )}

            {permissions.canCadastralUpdate && (
              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    void executeAction(
                      '/cadastral-update',
                      { note: actionNote || 'Đã cập nhật hồ sơ địa chính off-chain' },
                      'Đã ghi nhận cập nhật hồ sơ địa chính.'
                    )
                  }
                >
                  Ghi nhận cập nhật địa chính
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
