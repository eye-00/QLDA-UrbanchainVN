import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api';
import {
  DOCUMENT_TYPE_OPTIONS,
  type UploadedFileItem,
  shortValue,
  uploadRegistrationFile
} from '../lib/files';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import { loadCommuneOptionsByProvince, loadProvinceOptions, type CommuneOption, type ProvinceOption } from '../lib/vnAddress';
import { canOpenBlockchainSign } from './registrationBlockchainHelpers';

type RegistrationItem = {
  id: string;
  code: string;
  tokenId?: number | null;
  txHash?: string | null;
  landInfo: {
    parcelNumber: string;
    mapSheetNumber: string;
    address: string;
  };
  ownerInfo: {
    fullName: string;
  };
  status: string;
  cadastralUpdatedAt?: string | null;
  notes: string[];
  updatedAt: string;
};

type RegistrationListResponse = {
  items: RegistrationItem[];
  total: number;
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
  procedureCode: 'DKDD_LANDAU_3380',
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

  async function loadRegistrations() {
    try {
      const data = await apiGet<RegistrationListResponse>('/registrations');
      setItems(data.items);
    } catch {
      showToast('error', 'Không tải được danh sách hồ sơ đăng ký.');
    }
  }

  function switchToManualLocation(messageText: string) {
    setLocationMode('manual');
    setLocationNotice(messageText);
  }

  async function loadLocationCatalog() {
    if (locationMode !== 'api') return;
    try {
      const provinces = await loadProvinceOptions();
      setProvinceOptions(provinces);
    } catch {
      switchToManualLocation('Không tải được danh mục địa giới. Hệ thống chuyển sang nhập tay.');
    }
  }

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
  }, []);

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
      if (attachedFiles.length === 0) {
        showToast('error', 'Bạn chưa đính kèm tài liệu. Vẫn có thể tạo hồ sơ và bổ sung sau.');
      }

      const payload = {
        procedureCode: form.procedureCode,
        landInfo: {
          provinceCode: form.provinceCode,
          communeName: form.communeName,
          parcelNumber: form.parcelNumber,
          mapSheetNumber: form.mapSheetNumber,
          area: Number(form.area),
          landUsePurpose: form.landUsePurpose,
          address: form.address
        },
        ownerInfo: {
          ownerType: 'INDIVIDUAL',
          fullName: form.fullName,
          identityNumber: form.identityNumber
        },
        fileIds: attachedFiles.map((item) => item.id)
      };
      const data = await apiPost<CreateRegistrationResponse>('/registrations', payload);
      showToast('success', `Đã tạo hồ sơ ${data.registrationCode} (${getRegistrationStatusLabel(data.status)})`);
      setAttachedFiles([]);
      setUploadDrafts([makeUploadDraft()]);
      await loadRegistrations();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Tạo hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function submitRegistration(registrationId: string) {
    setLoading(true);
    try {
      await apiPost(`/registrations/${registrationId}/submit`, {
        legalBasisCode: `QĐ3380-SUBMIT-${new Date().getFullYear()}`
      });
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
          <h2>Nộp hồ sơ đăng ký đất đai lần đầu</h2>
          <p className="section-subtitle">
            Khai báo thông tin thửa đất theo địa giới 2 cấp, tải tài liệu hồ sơ và theo dõi trạng thái xử lý.
          </p>
        </div>
        <div className="action-row action-row-nowrap">
          <Link to="/wallets" className="btn-link btn-link-outline">
            Quản lý ví
          </Link>
          <button type="submit" form="citizen-registration-form" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo hồ sơ'}
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
                    <td>{file.documentType}</td>
                    <td>{file.storageStatus}</td>
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

      <div className="section-header">
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
                        <div className="action-row">
                          {canSubmit ? (
                            <button type="button" disabled={loading} onClick={() => void submitRegistration(item.id)}>
                              Gửi hồ sơ
                            </button>
                          ) : (
                            <span className="muted">Đã gửi</span>
                          )}
                          {canSignBlockchain ? (
                            <Link to={`/registrations/${item.id}/blockchain-sign`} className="btn-link btn-link-outline">
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
    </section>
  );
}

