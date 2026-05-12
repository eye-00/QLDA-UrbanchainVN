import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiRequestError, apiGet, apiPost } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { getFileDownload, getFileIntegrity, getFileMetadata, shortValue, type UploadedFileItem } from '../lib/files';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import {
  getReviewPermissions,
  getReviewStepsByStatus,
  isActionAllowedForStatus,
  isTaxTransferReady,
  requiresActionNote,
  toBlockchainDisplayValue,
  type ReviewActionKey
} from './registrationReviewHelpers';

type RegistrationItem = {
  id: string;
  code: string;
  applicantId: string;
  status: string;
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
  landCode: string | null;
  tokenId: number | null;
  txHash: string | null;
  ipfsCid: string | null;
  documentHash: string | null;
  paymentObligations?: Array<{
    id: string;
    type: string;
    status: string;
    amount: number | null;
    referenceNo: string | null;
    fulfilledAt: string | null;
  }>;
  files: UploadedFileItem[];
  notes: string[];
  updatedAt: string;
};

export function RegistrationReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [item, setItem] = useState<RegistrationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [procedureCode, setProcedureCode] = useState('1.013978');
  const [legalBasisCode, setLegalBasisCode] = useState('151/2025-ND-CP|3380/QD-BNNMT');
  const [evidenceText, setEvidenceText] = useState('');
  const [taxReferenceNo, setTaxReferenceNo] = useState('');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [selectedFileMetadata, setSelectedFileMetadata] = useState<UploadedFileItem | null>(null);
  const [fileActionLoadingId, setFileActionLoadingId] = useState<string | null>(null);

  const permissions = useMemo(() => getReviewPermissions(user?.role), [user?.role]);
  const reviewSteps = useMemo(() => (item ? getReviewStepsByStatus(item.status) : []), [item]);

  function goBackToList() {
    navigate('/registrations/review');
  }

  async function loadRegistrationDetail() {
    if (!id) {
      setLoadError('Không tìm thấy mã hồ sơ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<RegistrationItem>(`/registrations/${id}`);
      setItem(data);
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được chi tiết hồ sơ.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRegistrationDetail();
  }, [id]);

  function getActionDisplayName(action: ReviewActionKey) {
    const labels: Record<ReviewActionKey, string> = {
      accept: 'tiếp nhận',
      requestSupplement: 'yêu cầu bổ sung',
      reject: 'từ chối',
      communeConfirm: 'xác nhận cấp xã',
      taxTransfer: 'chuyển thuế',
      approve: 'phê duyệt',
      cadastralUpdate: 'cập nhật hồ sơ địa chính',
      blockchainSync: 'đồng bộ blockchain'
    };
    return labels[action];
  }

  async function executeAction(
    action: ReviewActionKey,
    path: string,
    body: Record<string, unknown>,
    successMessage: string
  ) {
    if (!item) return;
    if (!isActionAllowedForStatus(action, item.status)) {
      showToast(
        'error',
        `Không thể ${getActionDisplayName(action)} khi hồ sơ đang ở trạng thái ${getRegistrationStatusLabel(item.status)}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiPost(`/registrations/${item.id}${path}`, body);
      showToast('success', successMessage);
      setActionNote('');
      setEvidenceText('');
      setTaxReferenceNo('');
      setApprovalNumber('');
      await loadRegistrationDetail();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không thực hiện được thao tác.');
    } finally {
      setSubmitting(false);
    }
  }

  function parseEvidenceIds() {
    return evidenceText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function withLegalPayload(body: Record<string, unknown>, fallbackReason: string) {
    return {
      ...body,
      procedureCode,
      legalBasisCode,
      reason: actionNote.trim() || fallbackReason,
      evidenceIds: parseEvidenceIds()
    };
  }

  function requireNoteFor(actionLabel: string) {
    if (requiresActionNote('supplement', actionNote)) return true;
    showToast('error', `Vui lòng nhập ghi chú để ${actionLabel.toLowerCase()}.`);
    return false;
  }

  async function handleViewFileMetadata(fileId: string) {
    setFileActionLoadingId(fileId);
    try {
      const metadata = await getFileMetadata(fileId);
      setSelectedFileMetadata(metadata);
      showToast('success', 'Đã tải metadata tệp hồ sơ.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được metadata tệp.');
    } finally {
      setFileActionLoadingId(null);
    }
  }

  async function handleGetFileDownload(fileId: string) {
    setFileActionLoadingId(fileId);
    try {
      const data = await getFileDownload(fileId);
      if (!data.downloadUrl) {
        showToast('error', 'Tệp chưa có liên kết tải xuống hợp lệ.');
        return;
      }
      globalThis.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      showToast('success', 'Đã mở liên kết tải tệp.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không lấy được liên kết tải tệp.');
    } finally {
      setFileActionLoadingId(null);
    }
  }

  async function handleCheckFileIntegrity(fileId: string) {
    setFileActionLoadingId(fileId);
    try {
      const result = await getFileIntegrity(fileId);
      if (result.isValid) {
        showToast('success', 'Tệp hợp lệ: CID/hash/trạng thái lưu trữ đều khớp.');
      } else {
        showToast('error', 'Tệp có rủi ro toàn vẹn. Vui lòng kiểm tra lại nguồn tệp.');
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        showToast('error', error.message);
      } else {
        showToast('error', 'Không kiểm tra được toàn vẹn tệp.');
      }
    } finally {
      setFileActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Chi tiết xử lý hồ sơ</h2>
        <p className="section-subtitle">Đang tải dữ liệu...</p>
      </section>
    );
  }

  if (loadError || !item) {
    return (
      <section className="card row-gap">
        <h2>Chi tiết xử lý hồ sơ</h2>
        <p className="error-notice">{loadError || 'Không tìm thấy hồ sơ.'}</p>
        <div className="action-row">
          <button type="button" className="btn btn-outline" onClick={goBackToList}>
            Quay lại danh sách
          </button>
        </div>
      </section>
    );
  }

  const canAccept = permissions.canAccept && isActionAllowedForStatus('accept', item.status);
  const canRequestSupplement =
    permissions.canRequestSupplement && isActionAllowedForStatus('requestSupplement', item.status);
  const canReject = permissions.canReject && isActionAllowedForStatus('reject', item.status);
  const canCommuneConfirm =
    permissions.canCommuneConfirm && isActionAllowedForStatus('communeConfirm', item.status);
  const canTaxTransfer = permissions.canTaxTransfer && isActionAllowedForStatus('taxTransfer', item.status);
  const canApprove = permissions.canApprove && isActionAllowedForStatus('approve', item.status);
  const canCadastralUpdate =
    permissions.canCadastralUpdate && isActionAllowedForStatus('cadastralUpdate', item.status);
  const canBlockchainSync =
    permissions.canBlockchainSync && isActionAllowedForStatus('blockchainSync', item.status);

  return (
    <section className="toolbar-row">
      <div className="section-header">
        <div>
          <h2>Chi tiết xử lý hồ sơ {item.code}</h2>
          <p className="section-subtitle">Người nộp: {item.applicantId}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goBackToList}>
          Quay lại
        </button>
      </div>

      <div className="card row-gap">
        <div className="card-title-row">
          <div className="action-row">
            <span className={`badge ${getRegistrationStatusBadgeClass(item.status)}`}>
              {getRegistrationStatusLabel(item.status)}
            </span>
            <span className="badge">Cập nhật: {new Date(item.updatedAt).toLocaleString('vi-VN')}</span>
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
            <div>Tỉnh/Thành phố: {item.landInfo.provinceCode}</div>
            <div>Xã/Phường/Đặc khu: {item.landInfo.communeName}</div>
            <div>Số tờ / Số thửa: {item.landInfo.mapSheetNumber} / {item.landInfo.parcelNumber}</div>
            <div>Diện tích: {item.landInfo.area} m²</div>
            <div>Mục đích sử dụng: {item.landInfo.landUsePurpose}</div>
            <div>Địa chỉ: {item.landInfo.address}</div>
          </div>
          <div className="row-gap">
            <h3>Thông tin chủ sử dụng</h3>
            <div>Họ tên: {item.ownerInfo.fullName}</div>
            <div>Số định danh: {item.ownerInfo.identityNumber ?? 'Chưa khai báo'}</div>
            <div>Địa chỉ: {item.ownerInfo.address ?? 'Chưa khai báo'}</div>
            <div>Người nộp hồ sơ: {item.applicantId}</div>
          </div>
        </div>

        <div className="row-gap">
          <h3>Thông tin blockchain</h3>
          <div>Mã thửa nghiệp vụ: {toBlockchainDisplayValue(item.landCode)}</div>
          <div>Token ID: {toBlockchainDisplayValue(item.tokenId)}</div>
          <div>Transaction hash: {toBlockchainDisplayValue(item.txHash)}</div>
          <div>CID IPFS: {toBlockchainDisplayValue(item.ipfsCid)}</div>
          <div>Metadata hash: {toBlockchainDisplayValue(item.documentHash)}</div>
        </div>

        <div className="row-gap">
          <h3>Nghĩa vụ tài chính</h3>
          {!item.paymentObligations || item.paymentObligations.length === 0 ? (
            <div className="empty-state">Chưa phát sinh nghĩa vụ tài chính.</div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loại nghĩa vụ</th>
                    <th>Trạng thái</th>
                    <th>Số tiền</th>
                    <th>Mã tham chiếu</th>
                    <th>Hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {item.paymentObligations.map((obligation) => (
                    <tr key={obligation.id}>
                      <td>{obligation.type === 'INTAKE_FEE' ? 'Lệ phí tiếp nhận' : 'Nghĩa vụ tài chính đất đai'}</td>
                      <td>{obligation.status}</td>
                      <td>{obligation.amount ? obligation.amount.toLocaleString('vi-VN') : 'Chưa xác định'}</td>
                      <td>{obligation.referenceNo ?? 'Chưa có'}</td>
                      <td>{obligation.fulfilledAt ? new Date(obligation.fulfilledAt).toLocaleString('vi-VN') : 'Chưa hoàn thành'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="row-gap">
          <h3>Tài liệu hồ sơ đính kèm</h3>
          {item.files.length === 0 ? (
            <div className="empty-state">Hồ sơ hiện chưa có tệp đính kèm.</div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên tệp</th>
                    <th>Loại giấy tờ</th>
                    <th>Trạng thái</th>
                    <th>CID</th>
                    <th>Hash</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {item.files.map((file) => (
                    <tr key={file.id}>
                      <td>{file.originalName}</td>
                      <td>{file.documentType}</td>
                      <td>{file.storageStatus}</td>
                      <td className="muted">{shortValue(file.cid)}</td>
                      <td className="muted">{shortValue(file.hash)}</td>
                      <td>
                        <div className="action-row">
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={fileActionLoadingId === file.id}
                            onClick={() => void handleViewFileMetadata(file.id)}
                          >
                            Xem metadata
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={fileActionLoadingId === file.id}
                            onClick={() => void handleGetFileDownload(file.id)}
                          >
                            Lấy link tải
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={fileActionLoadingId === file.id}
                            onClick={() => void handleCheckFileIntegrity(file.id)}
                          >
                            Kiểm tra toàn vẹn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedFileMetadata && (
            <div className="notice">
              <strong>Metadata tệp đang xem:</strong>
              <div>ID: {selectedFileMetadata.id}</div>
              <div>Tên tệp: {selectedFileMetadata.originalName}</div>
              <div>Loại giấy tờ: {selectedFileMetadata.documentType}</div>
              <div>Trạng thái: {selectedFileMetadata.storageStatus}</div>
              <div>CID: {selectedFileMetadata.cid ?? 'Chưa có'}</div>
              <div>Hash: {selectedFileMetadata.hash ?? 'Chưa có'}</div>
            </div>
          )}
        </div>

        <div className="row-gap review-action-panel">
          <h3>Thao tác xử lý</h3>
          <div className="form-grid">
            <label>
              Mã thủ tục
              <input value={procedureCode} onChange={(event) => setProcedureCode(event.target.value)} placeholder="1.013978" />
            </label>
            <label>
              Căn cứ pháp lý
              <input value={legalBasisCode} onChange={(event) => setLegalBasisCode(event.target.value)} placeholder="151/2025-ND-CP|3380/QD-BNNMT" />
            </label>
            <label className="field-span-2">
              Mã chứng cứ (ngăn cách bởi dấu phẩy)
              <input value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} placeholder="EV-001, EV-002" />
            </label>
          </div>
          <label>
            Ghi chú xử lý
            <input
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              placeholder="Nhập ghi chú hoặc lý do xử lý..."
            />
          </label>

          <div className="action-row">
            {canAccept && (
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void executeAction(
                    'accept',
                    '/accept',
                    withLegalPayload({}, 'Bộ phận một cửa đã tiếp nhận hồ sơ'),
                    'Đã tiếp nhận hồ sơ.'
                  )
                }
              >
                Tiếp nhận
              </button>
            )}
            {canRequestSupplement && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={submitting}
                onClick={() => {
                  if (!requireNoteFor('yêu cầu bổ sung')) return;
                  void executeAction(
                    'requestSupplement',
                    '/request-supplement',
                    withLegalPayload({ note: actionNote }, actionNote),
                    'Đã yêu cầu bổ sung hồ sơ.'
                  );
                }}
              >
                Yêu cầu bổ sung
              </button>
            )}
            {canReject && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={submitting}
                onClick={() => {
                  if (!requireNoteFor('từ chối hồ sơ')) return;
                  void executeAction(
                    'reject',
                    '/reject',
                    withLegalPayload({ note: actionNote }, actionNote),
                    'Đã từ chối hồ sơ.'
                  );
                }}
              >
                Từ chối
              </button>
            )}
          </div>

          {canCommuneConfirm && (
            <div className="action-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void executeAction(
                    'communeConfirm',
                    '/commune-confirm',
                    withLegalPayload(
                      { confirmed: true, notes: actionNote || undefined },
                      actionNote || 'UBND cấp xã xác nhận thông tin hồ sơ'
                    ),
                    'Đã xác nhận cấp xã.'
                  )
                }
              >
                Xác nhận cấp xã
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={submitting}
                onClick={() =>
                  void executeAction(
                    'communeConfirm',
                    '/commune-confirm',
                    withLegalPayload(
                      { confirmed: false, notes: actionNote || undefined },
                      actionNote || 'UBND cấp xã yêu cầu bổ sung hồ sơ'
                    ),
                    'Đã trả hồ sơ bổ sung từ cấp xã.'
                  )
                }
              >
                Trả bổ sung
              </button>
            </div>
          )}

          {canTaxTransfer && (
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
                  disabled={submitting}
                  onClick={() => {
                    if (!isTaxTransferReady(taxReferenceNo)) {
                      showToast('error', 'Vui lòng nhập mã chuyển thuế trước khi thực hiện.');
                      return;
                    }
                    void executeAction(
                      'taxTransfer',
                      '/tax-transfer',
                      withLegalPayload(
                        { taxReferenceNo, notes: actionNote || undefined },
                        actionNote || 'Chuyển hồ sơ xác định nghĩa vụ tài chính'
                      ),
                      'Đã chuyển thông tin nghĩa vụ tài chính.'
                    );
                  }}
                >
                  Chuyển thuế
                </button>
              </div>
            </div>
          )}

          {canApprove && (
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
                  disabled={submitting}
                  onClick={() =>
                    void executeAction(
                      'approve',
                      '/approve',
                      withLegalPayload(
                        {
                          approvalNumber: approvalNumber || undefined,
                          approvalDate: new Date().toISOString().slice(0, 10),
                          note: actionNote || undefined
                        },
                        actionNote || 'Đã phê duyệt/ký cấp hồ sơ'
                      ),
                      'Đã phê duyệt hồ sơ.'
                    )
                  }
                >
                  Phê duyệt
                </button>
              </div>
            </div>
          )}

          {canCadastralUpdate && (
            <div className="action-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void executeAction(
                    'cadastralUpdate',
                    '/cadastral-update',
                    withLegalPayload({}, actionNote || 'Đã cập nhật hồ sơ địa chính/CSDL đất đai'),
                    'Đã cập nhật hồ sơ địa chính.'
                  )
                }
              >
                Cập nhật hồ sơ địa chính
              </button>
            </div>
          )}

          {canBlockchainSync && (
            <div className="row-gap">
              <div className="notice">
                Luồng ký blockchain được tách màn riêng để thao tác liền mạch và giảm lỗi khi xử lý hồ sơ.
              </div>
              <div className="action-row">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => navigate(`/registrations/review/${item.id}/blockchain-sign`)}
                >
                  Mở màn ký blockchain
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="row-gap">
          <h3>Lịch sử ghi chú</h3>
          {item.notes.length === 0 ? (
            <div className="empty-state">Chưa có ghi chú xử lý.</div>
          ) : (
            <ul className="note-list">
              {item.notes.map((note, index) => (
                <li key={`${item.id}-${index}`}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
