import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../lib/api';
import {
  DOCUMENT_TYPE_OPTIONS,
  type UploadedFileItem,
  shortValue,
  uploadRegistrationFile
} from '../lib/files';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import { getDocumentTypeLabel, getFileStorageStatusLabel } from '../ui/domainLabels';
import { loadCommuneOptionsByProvince, loadProvinceOptions, type CommuneOption, type ProvinceOption } from '../lib/vnAddress';
import { canOpenBlockchainSign } from './registrationBlockchainHelpers';
import {
  buildCreateRegistrationPayload,
  buildSubmitRegistrationPayload,
  DEFAULT_REGISTRATION_PROCEDURE_CODE
} from './registrationSubmissionHelpers';

type RegistrationItem = {
  id: string;
  code: string;
  tokenId?: number | null;
  txHash?: string | null;
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
  status: string;
  cadastralUpdatedAt?: string | null;
  notes: string[];
  updatedAt: string;
  files?: UploadedFileItem[];
};

type RegistrationListResponse = {
  items: RegistrationItem[];
  total: number;
};

type PaymentObligationItem = {
  id: string;
  type: string;
  status: string;
  amount: number | null;
  referenceNo: string | null;
  fulfilledAt?: string | null;
};

type PaymentObligationWithRegistration = PaymentObligationItem & {
  registrationCode: string;
  registrationId: string;
};

type CreateRegistrationResponse = {
  registrationId: string;
  registrationCode: string;
  status: string;
};

type UploadDraft = {
  id: string;
  documentType: string;
  file: File | null;
};

const initialForm = {
  procedureCode: DEFAULT_REGISTRATION_PROCEDURE_CODE,
  fullName: 'Nguyễn Văn A',
  identityNumber: '0482xxxxxxx',
  mapSheetNumber: '05',
  parcelNumber: '123',
  area: '120.5',
  landUsePurpose: 'ODT',
  address: '54 Nguyễn Lương Bằng',
  provinceCode: '',
  communeName: ''
};

type LocationMode = 'api' | 'manual';

function makeDraftId() {
  return `upload-draft-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function makeUploadDraft(): UploadDraft {
  return {
    id: makeDraftId(),
    documentType: DOCUMENT_TYPE_OPTIONS[0].value,
    file: null
  };
}

export function CitizenRegistrationPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>('api');
  const [locationNotice, setLocationNotice] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [communeOptions, setCommuneOptions] = useState<CommuneOption[]>([]);
  const [uploadDrafts, setUploadDrafts] = useState<UploadDraft[]>([makeUploadDraft()]);
  const [uploadingDraftId, setUploadingDraftId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFileItem[]>([]);

  // New states for selection, editing, and payment simulation
  const [editingRegistrationId, setEditingRegistrationId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string>('');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);
  const [selectedPaymentObligations, setSelectedPaymentObligations] = useState<PaymentObligationItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payingObligation, setPayingObligation] = useState<PaymentObligationItem | PaymentObligationWithRegistration | null>(null);
  const [mockPaymentSuccess, setMockPaymentSuccess] = useState<boolean>(false);
  const [allObligations, setAllObligations] = useState<PaymentObligationWithRegistration[]>([]);

  const loadAllObligations = useCallback(async (registrationItems: RegistrationItem[]) => {
    try {
      const promises = registrationItems.map(async (reg) => {
        try {
          const res = await apiGet<{ items: PaymentObligationItem[] }>(`/registrations/${reg.id}/payment-obligations`);
          return res.items.map((ob) => ({ ...ob, registrationCode: reg.code, registrationId: reg.id }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(promises);
      const flattened = results.flat();
      setAllObligations(flattened);
    } catch (err) {
      console.error('Error fetching all obligations:', err);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      const data = await apiGet<RegistrationListResponse>('/registrations');
      setItems(data.items);
      void loadAllObligations(data.items);
    } catch {
      showToast('error', 'Không tải được danh sách hồ sơ đăng ký.');
    }
  }, [showToast, loadAllObligations]);

  const handleSelectRegistration = useCallback(async (item: RegistrationItem) => {
    setSelectedRegistration(item);
    try {
      const data = await apiGet<{ items: PaymentObligationItem[] }>(`/registrations/${item.id}/payment-obligations`);
      setSelectedPaymentObligations(data.items);
    } catch {
      setSelectedPaymentObligations([]);
    }
  }, []);

  function startEditing(item: RegistrationItem) {
    setEditingRegistrationId(item.id);
    setEditingCode(item.code);
    setForm({
      procedureCode: item.procedureCode ?? DEFAULT_REGISTRATION_PROCEDURE_CODE,
      fullName: item.ownerInfo.fullName,
      identityNumber: item.ownerInfo.identityNumber ?? '',
      mapSheetNumber: item.landInfo.mapSheetNumber,
      parcelNumber: item.landInfo.parcelNumber,
      area: String(item.landInfo.area),
      landUsePurpose: item.landInfo.landUsePurpose,
      address: item.landInfo.address,
      provinceCode: item.landInfo.provinceCode,
      communeName: item.landInfo.communeName
    });
    if (item.landInfo.provinceCode && locationMode === 'api') {
      void loadCommuneOptionsByProvince(item.landInfo.provinceCode).then((communes) => {
        setCommuneOptions(communes);
      }).catch(() => {});
    }
    setAttachedFiles(item.files ?? []);
    const formEl = document.getElementById('citizen-registration-form');
    formEl?.scrollIntoView({ behavior: 'smooth' });
    showToast('success', `Đang chỉnh sửa hồ sơ nháp/cần bổ sung ${item.code}.`);
  }

  function cancelEditing() {
    setEditingRegistrationId(null);
    setEditingCode('');
    setForm(initialForm);
    setCommuneOptions([]);
    setAttachedFiles([]);
  }

  const switchToManualLocation = useCallback((messageText: string) => {
    setLocationMode('manual');
    setLocationNotice(messageText);
  }, []);

  const loadLocationCatalog = useCallback(async () => {
    if (locationMode !== 'api') return;
    try {
      const provinces = await loadProvinceOptions();
      setProvinceOptions(provinces);
    } catch {
      switchToManualLocation('Không tải được danh mục địa giới. Hệ thống chuyển sang nhập tay.');
    }
  }, [locationMode, switchToManualLocation]);

  async function onProvinceChange(provinceCode: string) {
    setForm({ ...form, provinceCode, communeName: '' });
    if (locationMode !== 'api' || !provinceCode) {
      setCommuneOptions([]);
      return;
    }
    try {
      const communes = await loadCommuneOptionsByProvince(provinceCode);
      setCommuneOptions(communes);
    } catch {
      switchToManualLocation('Không tải được danh mục địa giới. Hệ thống chuyển sang nhập tay.');
    }
  }

  useEffect(() => {
    void Promise.all([loadRegistrations(), loadLocationCatalog()]);
  }, [loadLocationCatalog, loadRegistrations]);

  function updateUploadDraft(draftId: string, patch: Partial<UploadDraft>) {
    setUploadDrafts((prev) => prev.map((item) => (item.id === draftId ? { ...item, ...patch } : item)));
  }

  function removeUploadDraft(draftId: string) {
    setUploadDrafts((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== draftId);
    });
  }

  function addUploadDraft() {
    setUploadDrafts((prev) => [...prev, makeUploadDraft()]);
  }

  async function onUploadDraft(draftId: string) {
    const draft = uploadDrafts.find((item) => item.id === draftId);
    if (!draft?.file) {
      showToast('error', 'Vui lòng chọn tệp trước khi tải lên.');
      return;
    }

    setUploadingDraftId(draftId);
    try {
      const uploaded = await uploadRegistrationFile(draft.file, draft.documentType);
      setAttachedFiles((prev) => [uploaded, ...prev]);
      updateUploadDraft(draftId, { file: null });
      showToast('success', `Đã tải tệp ${uploaded.originalName} lên IPFS.`);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Tải tệp thất bại.');
    } finally {
      setUploadingDraftId(null);
    }
  }

  function removeAttachedFile(fileId: string) {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== fileId));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = buildCreateRegistrationPayload(form, attachedFiles);
      if (editingRegistrationId) {
        // Edit flow
        const data = await apiPatch<CreateRegistrationResponse>(`/registrations/${editingRegistrationId}`, payload);
        showToast('success', `Đã cập nhật hồ sơ ${data.registrationCode} thành công.`);
        setEditingRegistrationId(null);
        setEditingCode('');
        setForm(initialForm);
        setCommuneOptions([]);
        if (selectedRegistration && selectedRegistration.id === editingRegistrationId) {
          setSelectedRegistration(null);
        }
      } else {
        // Create flow
        if (attachedFiles.length === 0) {
          showToast('error', 'Bạn chưa đính kèm tài liệu. Vẫn có thể tạo hồ sơ và bổ sung sau.');
        }
        const data = await apiPost<CreateRegistrationResponse>('/registrations', payload);
        showToast('success', `Đã tạo hồ sơ ${data.registrationCode} (${getRegistrationStatusLabel(data.status)})`);
      }
      setAttachedFiles([]);
      setUploadDrafts([makeUploadDraft()]);
      await loadRegistrations();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function submitRegistration(registrationId: string) {
    setLoading(true);
    try {
      await apiPost(`/registrations/${registrationId}/submit`, buildSubmitRegistrationPayload());
      showToast('success', 'Đã gửi hồ sơ vào luồng tiếp nhận.');
      await loadRegistrations();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không gửi được hồ sơ.');
    } finally {
      setLoading(false);
    }
  }

  const canUseCatalog = locationMode === 'api' && provinceOptions.length > 0;

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>{editingRegistrationId ? `Chỉnh sửa hồ sơ: ${editingCode}` : 'Nộp hồ sơ đăng ký đất đai lần đầu'}</h2>
          <p className="section-subtitle">
            {editingRegistrationId 
              ? 'Cập nhật lại thông tin thửa đất và đính kèm tài liệu bổ sung trước khi nộp lại.'
              : 'Khai báo thông tin thửa đất theo địa giới 2 cấp, tải tài liệu hồ sơ và theo dõi trạng thái xử lý.'}
          </p>
        </div>
        <div className="action-row action-row-nowrap">
          {editingRegistrationId && (
            <button type="button" className="btn btn-outline" onClick={cancelEditing} disabled={loading}>
              Hủy chỉnh sửa
            </button>
          )}
          <Link to="/citizen/wallets" className="btn-link btn-link-outline">
            Quản lý ví
          </Link>
          <button type="submit" form="citizen-registration-form" disabled={loading}>
            {loading ? (editingRegistrationId ? 'Đang cập nhật...' : 'Đang tạo...') : (editingRegistrationId ? 'Lưu thay đổi' : 'Tạo hồ sơ')}
          </button>
        </div>
      </div>
      {locationNotice && <p className="notice">{locationNotice}</p>}
      <form id="citizen-registration-form" onSubmit={onSubmit} className="card form-grid form-grid-fluid">
        <label>Họ tên người sử dụng đất
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label>Số định danh / CCCD
          <input value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} />
        </label>
        <label>Số tờ bản đồ
          <input value={form.mapSheetNumber} onChange={(e) => setForm({ ...form, mapSheetNumber: e.target.value })} />
        </label>
        <label>Số thửa
          <input value={form.parcelNumber} onChange={(e) => setForm({ ...form, parcelNumber: e.target.value })} />
        </label>
        <label>Diện tích (m²)
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </label>
        <label>Mục đích sử dụng đất
          <input value={form.landUsePurpose} onChange={(e) => setForm({ ...form, landUsePurpose: e.target.value })} />
        </label>
        {canUseCatalog ? (
          <>
            <label>Tỉnh/Thành phố
              <select value={form.provinceCode} onChange={(e) => void onProvinceChange(e.target.value)} required>
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinceOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>Xã/Phường/Đặc khu
              <select
                value={form.communeName}
                onChange={(e) => setForm({ ...form, communeName: e.target.value })}
                required
                disabled={!form.provinceCode}
              >
                <option value="">
                  {form.provinceCode ? 'Chọn Xã/Phường/Đặc khu' : 'Chọn Tỉnh/Thành phố trước'}
                </option>
                {communeOptions.map((item) => (
                  <option key={item.code} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label>Tỉnh/Thành phố
              <input value={form.provinceCode} onChange={(e) => setForm({ ...form, provinceCode: e.target.value })} required />
            </label>
            <label>Xã/Phường/Đặc khu
              <input value={form.communeName} onChange={(e) => setForm({ ...form, communeName: e.target.value })} required />
            </label>
          </>
        )}
        <label className="field-span-2">Địa chỉ thửa đất
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
      </form>

      <div className="card row-gap">
        <div className="section-header">
          <div>
            <h3>Tài liệu hồ sơ</h3>
            <p className="section-subtitle">Các loại giấy tờ bên dưới đều tùy chọn, bạn có thể tải lên từng tệp trước khi tạo hồ sơ.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={addUploadDraft}>
            Thêm dòng tải tệp
          </button>
        </div>

        {uploadDrafts.map((draft) => (
          <div className="form-grid-4" key={draft.id}>
            <label>
              Loại giấy tờ
              <select
                value={draft.documentType}
                onChange={(event) => updateUploadDraft(draft.id, { documentType: event.target.value })}
              >
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tệp đính kèm
              <input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  updateUploadDraft(draft.id, { file });
                }}
              />
            </label>
            <div className="row-gap">
              <span className="muted">Tệp đã chọn</span>
              <strong>{draft.file?.name ?? 'Chưa chọn tệp'}</strong>
            </div>
            <div className="action-row">
              <button
                type="button"
                onClick={() => void onUploadDraft(draft.id)}
                disabled={loading || uploadingDraftId === draft.id}
              >
                {uploadingDraftId === draft.id ? 'Đang tải...' : 'Tải tệp'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={uploadDrafts.length === 1 || loading || uploadingDraftId === draft.id}
                onClick={() => removeUploadDraft(draft.id)}
              >
                Xóa dòng
              </button>
            </div>
          </div>
        ))}

        {attachedFiles.length === 0 ? (
          <div className="empty-state">Chưa có tài liệu nào được đính kèm vào hồ sơ.</div>
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
                {attachedFiles.map((file) => (
                  <tr key={file.id}>
                    <td>{file.originalName}</td>
                    <td>{getDocumentTypeLabel(file.documentType)}</td>
                    <td>{getFileStorageStatusLabel(file.storageStatus)}</td>
                    <td className="muted">{shortValue(file.cid)}</td>
                    <td className="muted">{shortValue(file.hash)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => removeAttachedFile(file.id)}
                        disabled={loading}
                      >
                        Gỡ khỏi hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Financial Obligations Section */}
      <div className="section-header" style={{ marginTop: '30px' }}>
        <div>
          <h3>Nghĩa vụ tài chính của tôi</h3>
          <p className="section-subtitle">Danh sách nghĩa vụ tài chính cần thực hiện trên toàn bộ các hồ sơ đất đai đã khai báo.</p>
        </div>
      </div>
      {allObligations.length === 0 ? (
        <div className="card empty-state" style={{ background: 'var(--color-bg-alt, #fafbfc)', border: '1px dashed #e0e0e0', padding: '20px', textAlign: 'center' }}>
          Không có nghĩa vụ tài chính nào cần thực hiện.
        </div>
      ) : (
        <div className="card" style={{ borderLeft: '4px solid var(--color-brand, #3f51b5)', background: '#fff' }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Loại nghĩa vụ</th>
                  <th>Trạng thái</th>
                  <th>Số tiền cần nộp</th>
                  <th>Mã tham chiếu</th>
                  <th>Ngày hoàn thành</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {allObligations.map((obligation) => (
                  <tr key={obligation.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-brand, #3f51b5)' }}>{obligation.registrationCode}</td>
                    <td>Nghĩa vụ tài chính đất đai</td>
                    <td>
                      <span className={`badge ${obligation.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                        {obligation.status === 'CONFIRMED' ? 'Đã hoàn thành' : 'Chờ thanh toán'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>
                      {obligation.amount ? obligation.amount.toLocaleString('vi-VN') + ' VND' : 'Chưa xác định'}
                    </td>
                    <td>{obligation.referenceNo ?? 'Chưa có'}</td>
                    <td>{obligation.fulfilledAt ? new Date(obligation.fulfilledAt).toLocaleString('vi-VN') : 'Chưa hoàn thành'}</td>
                    <td>
                      {obligation.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '6px 14px', fontSize: '12px', background: '#e65100', borderColor: '#e65100', color: '#fff', fontWeight: 'bold' }}
                          onClick={() => {
                            setPayingObligation(obligation);
                            setShowPaymentModal(true);
                            setMockPaymentSuccess(false);
                          }}
                        >
                          Thanh toán trực tuyến
                        </button>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>Hoàn thành ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section-header" style={{ marginTop: '30px' }}>
        <h3>Danh sách hồ sơ đã tạo</h3>
        <button type="button" onClick={() => void loadRegistrations()}>Làm mới</button>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">Bạn chưa có hồ sơ đăng ký nào.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Chủ sử dụng</th>
                  <th>Thửa đất</th>
                  <th>Trạng thái</th>
                  <th>Blockchain</th>
                  <th>Cập nhật gần nhất</th>
                  <th>Ghi chú gần nhất</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const canSubmit = item.status === 'MOI_TAO' || item.status === 'CAN_BO_SUNG';
                  const canSignBlockchain = canOpenBlockchainSign(item.status, item.cadastralUpdatedAt ?? null);
                  return (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.ownerInfo.fullName}</td>
                      <td>
                        <div>{item.landInfo.mapSheetNumber} / {item.landInfo.parcelNumber}</div>
                        <div className="muted">{item.landInfo.address}</div>
                      </td>
                      <td>
                        <span className={`badge ${getRegistrationStatusBadgeClass(item.status)}`}>
                          {getRegistrationStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        {item.txHash ? (
                          <div className="row-gap-xs">
                            <div className="mono-text">{item.txHash.slice(0, 14)}...{item.txHash.slice(-6)}</div>
                            <div className="muted">Token #{item.tokenId ?? "N/A"}</div>
                          </div>
                        ) : (
                          <span className="muted">Chưa ghi chain</span>
                        )}
                      </td>
                      <td>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td>
                      <td>
                        {item.notes.length === 0 ? (
                          <span className="muted">Chưa có ghi chú</span>
                        ) : (
                          <ul className="note-list">
                            {item.notes.slice(-2).map((note, index) => (
                              <li key={`${item.id}-note-${index}`}>{note}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        <div className="action-row" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => void handleSelectRegistration(item)}>
                            Xem chi tiết
                          </button>
                          {canSubmit && (
                            <button type="button" className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => startEditing(item)}>
                              Sửa
                            </button>
                          )}
                          {canSubmit ? (
                            <button type="button" style={{ padding: '5px 10px', fontSize: '12px' }} disabled={loading} onClick={() => void submitRegistration(item.id)}>
                              Gửi hồ sơ
                            </button>
                          ) : (
                            !canSignBlockchain && <span className="muted" style={{ fontSize: '12px', padding: '5px' }}>Đã gửi</span>
                          )}
                          {canSignBlockchain ? (
                            <Link to={`/citizen/registrations/${item.id}/blockchain-sign`} className="btn-link btn-link-outline" style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', height: 'auto' }}>
                              Ký & gửi blockchain
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Registration Detail Card */}
      {selectedRegistration && (
        <div className="card row-gap" style={{ marginTop: '20px', border: '1px solid var(--color-brand)', background: '#fafbfc' }}>
          <div className="section-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-brand)' }}>Chi tiết hồ sơ: {selectedRegistration.code}</h3>
              <p className="section-subtitle" style={{ margin: 0 }}>Trạng thái: 
                <span className={`badge ${getRegistrationStatusBadgeClass(selectedRegistration.status)}`} style={{ marginLeft: '8px' }}>
                  {getRegistrationStatusLabel(selectedRegistration.status)}
                </span>
              </p>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => setSelectedRegistration(null)}>
              Đóng chi tiết
            </button>
          </div>

          <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
            <div className="row-gap" style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>Thông tin thửa đất</h4>
              <div>Tỉnh/Thành phố: {selectedRegistration.landInfo.provinceCode}</div>
              <div>Xã/Phường/Đặc khu: {selectedRegistration.landInfo.communeName}</div>
              <div>Số tờ / Số thửa: {selectedRegistration.landInfo.mapSheetNumber} / {selectedRegistration.landInfo.parcelNumber}</div>
              <div>Diện tích: {selectedRegistration.landInfo.area} m²</div>
              <div>Mục đích sử dụng: {selectedRegistration.landInfo.landUsePurpose}</div>
              <div>Địa chỉ: {selectedRegistration.landInfo.address}</div>
            </div>

            <div className="row-gap" style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>Thông tin chủ sở dụng</h4>
              <div>Họ tên: {selectedRegistration.ownerInfo.fullName}</div>
              <div>Số định danh: {selectedRegistration.ownerInfo.identityNumber ?? 'Chưa khai báo'}</div>
              <div>Địa chỉ: {selectedRegistration.ownerInfo.address ?? 'Chưa khai báo'}</div>
              <div>Cập nhật gần nhất: {new Date(selectedRegistration.updatedAt).toLocaleString('vi-VN')}</div>
            </div>
          </div>

          {/* Payment Obligations inside selected registration */}
          <div className="row-gap" style={{ marginTop: '15px', background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>Nghĩa vụ tài chính</h4>
            {selectedPaymentObligations.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>Chưa phát sinh nghĩa vụ tài chính cho hồ sơ này.</div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Loại nghĩa vụ</th>
                      <th>Trạng thái</th>
                      <th>Số tiền</th>
                      <th>Mã tham chiếu</th>
                      <th>Ngày hoàn thành</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPaymentObligations.map((obligation) => (
                      <tr key={obligation.id}>
                        <td>Nghĩa vụ tài chính đất đai</td>
                        <td>
                          <span className={`badge ${obligation.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                            {obligation.status === 'CONFIRMED' ? 'Đã hoàn thành' : 'Chờ thanh toán'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{obligation.amount ? obligation.amount.toLocaleString('vi-VN') + ' VND' : 'Chưa xác định'}</td>
                        <td>{obligation.referenceNo ?? 'Chưa có'}</td>
                        <td>{obligation.fulfilledAt ? new Date(obligation.fulfilledAt).toLocaleString('vi-VN') : 'Chưa hoàn thành'}</td>
                        <td>
                          {obligation.status === 'PENDING' ? (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => {
                                setPayingObligation(obligation);
                                setShowPaymentModal(true);
                                setMockPaymentSuccess(false);
                              }}
                            >
                              Thanh toán trực tuyến
                            </button>
                          ) : (
                            <span className="muted" style={{ fontSize: '12px' }}>Không cần hành động</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="row-gap" style={{ marginTop: '15px', background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>Lịch sử ghi chú xử lý</h4>
            {selectedRegistration.notes.length === 0 ? (
              <div className="empty-state" style={{ padding: '10px 0' }}>Chưa có ghi chú xử lý nào.</div>
            ) : (
              <ul className="note-list" style={{ margin: 0, paddingLeft: '20px' }}>
                {selectedRegistration.notes.map((note, index) => (
                  <li key={`${selectedRegistration.id}-note-detail-${index}`}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Online Payment Modal */}
      {showPaymentModal && payingObligation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#666'
              }}
              onClick={() => {
                setShowPaymentModal(false);
                setPayingObligation(null);
              }}
            >
              ✕
            </button>
            <h3 style={{ color: 'var(--color-brand)', margin: '0 0 20px 0', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              Thanh toán nghĩa vụ tài chính
            </h3>

            {mockPaymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px auto',
                  fontSize: '30px',
                  fontWeight: 'bold'
                }}>✓</div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#2e7d32' }}>Thanh toán giả lập thành công!</h4>
                <p className="muted" style={{ fontSize: '13px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Giao dịch thanh toán của bạn đã được ghi nhận thành công trên hệ thống. Trạng thái hồ sơ sẽ được cập nhật chính thức sau khi Cán bộ thuế xác nhận.
                </p>
                <button
                  type="button"
                  style={{ padding: '8px 20px' }}
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingObligation(null);
                    if (selectedRegistration) void handleSelectRegistration(selectedRegistration);
                  }}
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <div className="row-gap" style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span className="muted">Loại nghĩa vụ:</span>
                  <strong>Nghĩa vụ tài chính đất đai</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <span className="muted">Mã tham chiếu:</span>
                  <strong className="mono-text">{payingObligation.referenceNo ?? 'Chưa có'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <span className="muted">Số tiền cần nộp:</span>
                  <strong style={{ color: 'var(--color-brand)', fontSize: '16px' }}>
                    {payingObligation.amount ? payingObligation.amount.toLocaleString('vi-VN') + ' VND' : 'Chưa xác định'}
                  </strong>
                </div>

                <div style={{
                  padding: '15px',
                  background: '#f4f6f9',
                  borderRadius: '8px',
                  textAlign: 'center',
                  margin: '15px 0'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 'bold', color: '#666', letterSpacing: '1px' }}>
                    QUÉT MÃ QR QUA APP NGÂN HÀNG (GIẢ LẬP)
                  </p>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    background: '#1a1a1a',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ width: '130px', height: '130px', background: '#fff', padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1a1a1a' }}>
                      QR PAYMENT
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-brand)', fontWeight: '500' }}>
                    VietinBank - Số tài khoản: 112009876543
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                  <button
                    type="button"
                    style={{ background: '#2e7d32', borderColor: '#2e7d32', color: '#fff', fontWeight: 'bold' }}
                    onClick={() => {
                      setMockPaymentSuccess(true);
                      showToast('success', 'Thanh toán giả lập thành công! Chờ Cán bộ thuế phê duyệt.');
                      void loadRegistrations();
                    }}
                  >
                    Xác nhận đã chuyển
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPayingObligation(null);
                    }}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
