import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { loadCommuneOptionsByProvince, loadProvinceOptions, type CommuneOption, type ProvinceOption } from '../lib/vnAddress';
import { useToast } from '../ui/ToastContext';
import { buildLandPayload, buildLandQueryString } from './sprint2PageHelpers';

type LandItem = {
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
  owner: { userId: string; fullName: string; email: string } | null;
};

type LandListResponse = {
  items: LandItem[];
  total: number;
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

const initialCreateForm = {
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

const initialFilterForm = {
  keyword: '',
  provinceCode: '',
  communeName: ''
};

type LocationMode = 'api' | 'manual';

export function LandManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<LandItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [filterForm, setFilterForm] = useState(initialFilterForm);
  const [locationMode, setLocationMode] = useState<LocationMode>('api');
  const [locationNotice, setLocationNotice] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [createCommuneOptions, setCreateCommuneOptions] = useState<CommuneOption[]>([]);
  const [filterCommuneOptions, setFilterCommuneOptions] = useState<CommuneOption[]>([]);

  const queryString = useMemo(() => buildLandQueryString(filterForm), [filterForm]);
  const provinceLabelMap = useMemo(() => {
    const entries = provinceOptions.map((item) => [item.code, item.name] as const);
    return new Map<string, string>(entries);
  }, [provinceOptions]);

  function switchToManualLocation(message: string) {
    setLocationMode('manual');
    setLocationNotice(message);
  }

  async function loadCommunesForCreate(provinceCode: string) {
    if (!provinceCode || locationMode !== 'api') {
      setCreateCommuneOptions([]);
      return;
    }
    try {
      const communes = await loadCommuneOptionsByProvince(provinceCode);
      setCreateCommuneOptions(communes);
    } catch {
      switchToManualLocation('Không tải được danh mục địa giới. Hệ thống chuyển sang nhập tay.');
    }
  }

  async function loadCommunesForFilter(provinceCode: string) {
    if (!provinceCode || locationMode !== 'api') {
      setFilterCommuneOptions([]);
      return;
    }
    try {
      const communes = await loadCommuneOptionsByProvince(provinceCode);
      setFilterCommuneOptions(communes);
    } catch {
      switchToManualLocation('Không tải được danh mục địa giới. Hệ thống chuyển sang nhập tay.');
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

  async function loadLands() {
    setLoading(true);
    try {
      const path = queryString ? `/lands?${queryString}` : '/lands';
      const data = await apiGet<LandListResponse>(path);
      setItems(data.items);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách thửa đất');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    void Promise.all([loadLands(), loadUsersIfAllowed(), loadLocationCatalog()]);
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost('/lands', buildLandPayload(createForm));
      showToast('success', 'Đã tạo thửa đất');
      setCreateForm(initialCreateForm);
      setCreateCommuneOptions([]);
      await loadLands();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tạo được thửa đất');
    } finally {
      setLoading(false);
    }
  }

  async function onCreateProvinceChange(provinceCode: string) {
    setCreateForm({ ...createForm, provinceCode, communeName: '' });
    await loadCommunesForCreate(provinceCode);
  }

  async function onFilterProvinceChange(provinceCode: string) {
    setFilterForm({ ...filterForm, provinceCode, communeName: '' });
    await loadCommunesForFilter(provinceCode);
  }

  const canUseCatalog = locationMode === 'api' && provinceOptions.length > 0;

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Quản lý thửa đất</h2>
          <p className="section-subtitle">
            Quản trị thông tin thửa đất theo địa giới 2 cấp và liên kết chủ sử dụng theo phân quyền.
          </p>
        </div>
        <button type="button" onClick={() => void loadLands()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới danh sách'}
        </button>
      </div>

      {locationNotice && <p className="notice">{locationNotice}</p>}

      <form className="card form-grid-4" onSubmit={onCreate}>
        <label>
          Mã thửa
          <input
            value={createForm.parcelCode}
            onChange={(event) => setCreateForm({ ...createForm, parcelCode: event.target.value })}
            required
          />
        </label>
        {canUseCatalog ? (
          <>
            <label>
              Tỉnh/Thành phố
              <select
                value={createForm.provinceCode}
                onChange={(event) => void onCreateProvinceChange(event.target.value)}
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
                value={createForm.communeName}
                onChange={(event) => setCreateForm({ ...createForm, communeName: event.target.value })}
                required
                disabled={!createForm.provinceCode}
              >
                <option value="">
                  {createForm.provinceCode ? 'Chọn Xã/Phường/Đặc khu' : 'Chọn Tỉnh/Thành phố trước'}
                </option>
                {createCommuneOptions.map((item) => (
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
                value={createForm.provinceCode}
                onChange={(event) => setCreateForm({ ...createForm, provinceCode: event.target.value })}
                required
              />
            </label>
            <label>
              Xã/Phường/Đặc khu
              <input
                value={createForm.communeName}
                onChange={(event) => setCreateForm({ ...createForm, communeName: event.target.value })}
                required
              />
            </label>
          </>
        )}
        <label>
          Số tờ
          <input
            value={createForm.mapSheetNumber}
            onChange={(event) => setCreateForm({ ...createForm, mapSheetNumber: event.target.value })}
            required
          />
        </label>
        <label>
          Số thửa
          <input
            value={createForm.parcelNumber}
            onChange={(event) => setCreateForm({ ...createForm, parcelNumber: event.target.value })}
            required
          />
        </label>
        <label>
          Diện tích (m²)
          <input
            value={createForm.area}
            onChange={(event) => setCreateForm({ ...createForm, area: event.target.value })}
            required
          />
        </label>
        <label>
          Mục đích sử dụng đất
          <input
            value={createForm.landUsePurpose}
            onChange={(event) => setCreateForm({ ...createForm, landUsePurpose: event.target.value })}
            required
          />
        </label>
        <label>
          Địa chỉ thửa đất
          <input
            value={createForm.address}
            onChange={(event) => setCreateForm({ ...createForm, address: event.target.value })}
            required
          />
        </label>
        {user?.role === 'ADMIN' && (
          <label>
            Chủ sử dụng
            <select
              value={createForm.ownerUserId}
              onChange={(event) => setCreateForm({ ...createForm, ownerUserId: event.target.value })}
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
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Tạo thửa đất'}
        </button>
      </form>

      <div className="card form-grid-4">
        <label>
          Từ khóa
          <input
            value={filterForm.keyword}
            onChange={(event) => setFilterForm({ ...filterForm, keyword: event.target.value })}
            placeholder="Mã thửa, số thửa, địa chỉ..."
          />
        </label>
        {canUseCatalog ? (
          <>
            <label>
              Tỉnh/Thành phố
              <select
                value={filterForm.provinceCode}
                onChange={(event) => void onFilterProvinceChange(event.target.value)}
              >
                <option value="">Tất cả</option>
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
                value={filterForm.communeName}
                onChange={(event) => setFilterForm({ ...filterForm, communeName: event.target.value })}
                disabled={!filterForm.provinceCode}
              >
                <option value="">Tất cả</option>
                {filterCommuneOptions.map((item) => (
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
                value={filterForm.provinceCode}
                onChange={(event) => setFilterForm({ ...filterForm, provinceCode: event.target.value })}
              />
            </label>
            <label>
              Xã/Phường/Đặc khu
              <input
                value={filterForm.communeName}
                onChange={(event) => setFilterForm({ ...filterForm, communeName: event.target.value })}
              />
            </label>
          </>
        )}
        <button type="button" onClick={() => void loadLands()} disabled={loading}>
          Lọc danh sách
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Chưa có dữ liệu thửa đất.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã thửa</th>
                  <th>Khu vực</th>
                  <th>Số tờ / Số thửa</th>
                  <th>Diện tích</th>
                  <th>Mục đích sử dụng</th>
                  <th>Chủ sử dụng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.parcelCode}</div>
                      <div className="muted">{item.address}</div>
                    </td>
                    <td>{provinceLabelMap.get(item.provinceCode) ?? item.provinceCode} / {item.communeName}</td>
                    <td>{item.mapSheetNumber} / {item.parcelNumber}</td>
                    <td>{item.area} m²</td>
                    <td>{item.landUsePurpose}</td>
                    <td>{item.owner ? `${item.owner.fullName} (${item.owner.email})` : 'Chưa gán'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate(`/lands/${item.id}/edit`)}
                        disabled={loading}
                      >
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
