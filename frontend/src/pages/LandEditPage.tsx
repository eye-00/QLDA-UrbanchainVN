import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiGet, apiPatch } from '../lib/api';
import { loadCommuneOptionsByProvince, loadProvinceOptions, type CommuneOption, type ProvinceOption } from '../lib/vnAddress';
import { useToast } from '../ui/ToastContext';
import { buildLandPayload } from './sprint2PageHelpers';

type LandDetail = {
  id: string;
  parcelCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  area: number;
  landUsePurpose: string;
  address: string;
  ownerUserId: string | null;
};

type UserOption = {
  userId: string;
  fullName: string;
  email: string;
};

type UserListResponse = {
  items: UserOption[];
  total: number;
};

const initialForm = {
  parcelCode: '',
  provinceCode: '',
  communeName: '',
  mapSheetNumber: '',
  parcelNumber: '',
  area: '0',
  landUsePurpose: '',
  address: '',
  ownerUserId: ''
};

type LocationMode = 'api' | 'manual';

export function LandEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [locationMode, setLocationMode] = useState<LocationMode>('api');
  const [locationNotice, setLocationNotice] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [communeOptions, setCommuneOptions] = useState<CommuneOption[]>([]);

  const canUseCatalog = locationMode === 'api' && provinceOptions.length > 0;

  function goBackToList() {
    navigate('/staff/lands');
  }

  function switchToManualLocation(message: string) {
    setLocationMode('manual');
    setLocationNotice(message);
    setProvinceOptions([]);
    setCommuneOptions([]);
  }

  async function loadUsersIfAllowed() {
    if (user?.role !== 'ADMIN') return;
    try {
      const data = await apiGet<UserListResponse>('/users?pageSize=100');
      setUsers(data.items);
    } catch {
      setUsers([]);
    }
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

  async function loadCommunes(provinceCode: string) {
    if (!provinceCode || locationMode !== 'api') {
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

  async function loadLandDetail() {
    if (!id) {
      setLoadError('Không tìm thấy mã thửa đất.');
      setLoading(false);
      return;
    }

    try {
      const item = await apiGet<LandDetail>(`/lands/${id}`);
      setForm({
        parcelCode: item.parcelCode,
        provinceCode: item.provinceCode,
        communeName: item.communeName,
        mapSheetNumber: item.mapSheetNumber,
        parcelNumber: item.parcelNumber,
        area: String(item.area),
        landUsePurpose: item.landUsePurpose,
        address: item.address,
        ownerUserId: item.ownerUserId ?? ''
      });
      if (locationMode === 'api') {
        await loadCommunes(item.provinceCode);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được thông tin thửa đất');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadUsersIfAllowed(), loadLocationCatalog()]).then(() => loadLandDetail());
  }, [id]);

  async function onProvinceChange(provinceCode: string) {
    setForm({ ...form, provinceCode, communeName: '' });
    await loadCommunes(provinceCode);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await apiPatch(`/lands/${id}`, buildLandPayload(form));
      showToast('success', 'Đã cập nhật thửa đất');
      goBackToList();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được thửa đất');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Cập nhật thửa đất</h2>
        <p className="section-subtitle">Đang tải dữ liệu...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="card row-gap">
        <h2>Cập nhật thửa đất</h2>
        <p className="error-notice">{loadError}</p>
        <div className="action-row">
          <button type="button" className="btn btn-outline" onClick={goBackToList}>
            Quay lại danh sách
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="row-gap">
      <div className="section-header">
        <div>
          <h2>Cập nhật thửa đất</h2>
          <p className="section-subtitle">
            Chỉnh sửa thông tin thửa đất, lưu thay đổi và quay lại danh sách nhanh.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goBackToList}>
          Quay lại
        </button>
      </div>

      {locationNotice && <p className="notice">{locationNotice}</p>}

      <form className="card form-grid-4" onSubmit={onSubmit}>
        <label>
          Mã thửa
          <input
            value={form.parcelCode}
            onChange={(event) => setForm({ ...form, parcelCode: event.target.value })}
            required
          />
        </label>
        {canUseCatalog ? (
          <>
            <label>
              Tỉnh/Thành phố
              <select
                value={form.provinceCode}
                onChange={(event) => void onProvinceChange(event.target.value)}
                required
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinceOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Xã/Phường/Đặc khu
              <select
                value={form.communeName}
                onChange={(event) => setForm({ ...form, communeName: event.target.value })}
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
            <label>
              Tỉnh/Thành phố
              <input
                value={form.provinceCode}
                onChange={(event) => setForm({ ...form, provinceCode: event.target.value })}
                required
              />
            </label>
            <label>
              Xã/Phường/Đặc khu
              <input
                value={form.communeName}
                onChange={(event) => setForm({ ...form, communeName: event.target.value })}
                required
              />
            </label>
          </>
        )}
        <label>
          Số tờ
          <input
            value={form.mapSheetNumber}
            onChange={(event) => setForm({ ...form, mapSheetNumber: event.target.value })}
            required
          />
        </label>
        <label>
          Số thửa
          <input
            value={form.parcelNumber}
            onChange={(event) => setForm({ ...form, parcelNumber: event.target.value })}
            required
          />
        </label>
        <label>
          Diện tích (m²)
          <input
            value={form.area}
            onChange={(event) => setForm({ ...form, area: event.target.value })}
            required
          />
        </label>
        <label>
          Mục đích sử dụng đất
          <input
            value={form.landUsePurpose}
            onChange={(event) => setForm({ ...form, landUsePurpose: event.target.value })}
            required
          />
        </label>
        <label className="field-span-2">
          Địa chỉ thửa đất
          <input
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            required
          />
        </label>
        {user?.role === 'ADMIN' && (
          <label>
            Chủ sử dụng
            <select
              value={form.ownerUserId}
              onChange={(event) => setForm({ ...form, ownerUserId: event.target.value })}
            >
              <option value="">Không gán</option>
              {users.map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.fullName} ({item.email})
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="action-row action-row-nowrap field-span-2">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button type="button" className="btn btn-outline" onClick={goBackToList} disabled={submitting}>
            Hủy
          </button>
        </div>
      </form>
    </section>
  );
}
