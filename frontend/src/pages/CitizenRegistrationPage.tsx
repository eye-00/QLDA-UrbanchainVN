import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import { loadCommuneOptionsByProvince, loadProvinceOptions, type CommuneOption, type ProvinceOption } from '../lib/vnAddress';

type RegistrationItem = {
  id: string;
  code: string;
  landInfo: {
    parcelNumber: string;
    mapSheetNumber: string;
    address: string;
  };
  ownerInfo: {
    fullName: string;
  };
  status: string;
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

const initialForm = {
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

export function CitizenRegistrationPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState<LocationMode>('api');
  const [locationNotice, setLocationNotice] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [communeOptions, setCommuneOptions] = useState<CommuneOption[]>([]);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
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
        fileIds: []
      };
      const data = await apiPost<CreateRegistrationResponse>('/registrations', payload);
      showToast('success', `Đã tạo hồ sơ ${data.registrationCode} (${getRegistrationStatusLabel(data.status)})`);
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
      await apiPost(`/registrations/${registrationId}/submit`, {});
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
            Khai báo thông tin thửa đất theo địa giới 2 cấp và theo dõi trạng thái hồ sơ sau khi nộp.
          </p>
        </div>
      </div>
      {locationNotice && <p className="notice">{locationNotice}</p>}
      <form onSubmit={onSubmit} className="card form-grid">
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
        <label>Địa chỉ thửa đất
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo hồ sơ'}</button>
      </form>

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
                  <th>Cập nhật gần nhất</th>
                  <th>Ghi chú gần nhất</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const canSubmit = item.status === 'MOI_TAO' || item.status === 'CAN_BO_SUNG';
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
