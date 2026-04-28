import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/ToastContext';

type LandItem = {
  id: string;
  parcelCode: string;
  provinceCode: string;
  districtName: string;
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
  provinceCode: '48',
  districtName: '',
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
  districtName: '',
  communeName: ''
};

export function LandManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<LandItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [filterForm, setFilterForm] = useState(initialFilterForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialCreateForm);

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    if (filterForm.keyword.trim()) query.set('keyword', filterForm.keyword.trim());
    if (filterForm.provinceCode.trim()) query.set('provinceCode', filterForm.provinceCode.trim());
    if (filterForm.districtName.trim()) query.set('districtName', filterForm.districtName.trim());
    if (filterForm.communeName.trim()) query.set('communeName', filterForm.communeName.trim());
    return query.toString();
  }, [filterForm]);

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
    void Promise.all([loadLands(), loadUsersIfAllowed()]);
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost('/lands', {
        parcelCode: createForm.parcelCode,
        provinceCode: createForm.provinceCode,
        districtName: createForm.districtName,
        communeName: createForm.communeName,
        mapSheetNumber: createForm.mapSheetNumber,
        parcelNumber: createForm.parcelNumber,
        area: Number(createForm.area),
        landUsePurpose: createForm.landUsePurpose,
        address: createForm.address,
        ownerUserId: createForm.ownerUserId || null
      });
      showToast('success', 'Đã tạo thửa đất');
      setCreateForm(initialCreateForm);
      await loadLands();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tạo được thửa đất');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: LandItem) {
    setEditId(item.id);
    setEditForm({
      parcelCode: item.parcelCode,
      provinceCode: item.provinceCode,
      districtName: item.districtName,
      communeName: item.communeName,
      mapSheetNumber: item.mapSheetNumber,
      parcelNumber: item.parcelNumber,
      area: String(item.area),
      landUsePurpose: item.landUsePurpose,
      address: item.address,
      ownerUserId: item.ownerUserId ?? ''
    });
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editId) return;
    setLoading(true);
    try {
      await apiPatch(`/lands/${editId}`, {
        parcelCode: editForm.parcelCode,
        provinceCode: editForm.provinceCode,
        districtName: editForm.districtName,
        communeName: editForm.communeName,
        mapSheetNumber: editForm.mapSheetNumber,
        parcelNumber: editForm.parcelNumber,
        area: Number(editForm.area),
        landUsePurpose: editForm.landUsePurpose,
        address: editForm.address,
        ownerUserId: editForm.ownerUserId || null
      });
      showToast('success', 'Đã cập nhật thửa đất');
      setEditId(null);
      await loadLands();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được thửa đất');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Quản lý thửa đất</h2>
      <form className="card form-grid-4" onSubmit={onCreate}>
        <label>
          Mã thửa
          <input
            value={createForm.parcelCode}
            onChange={(event) => setCreateForm({ ...createForm, parcelCode: event.target.value })}
            required
          />
        </label>
        <label>
          Tỉnh/TP
          <input
            value={createForm.provinceCode}
            onChange={(event) => setCreateForm({ ...createForm, provinceCode: event.target.value })}
            required
          />
        </label>
        <label>
          Quận/Huyện
          <input
            value={createForm.districtName}
            onChange={(event) => setCreateForm({ ...createForm, districtName: event.target.value })}
            required
          />
        </label>
        <label>
          Xã/Phường
          <input
            value={createForm.communeName}
            onChange={(event) => setCreateForm({ ...createForm, communeName: event.target.value })}
            required
          />
        </label>
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
          Diện tích
          <input value={createForm.area} onChange={(event) => setCreateForm({ ...createForm, area: event.target.value })} required />
        </label>
        <label>
          Loại đất
          <input
            value={createForm.landUsePurpose}
            onChange={(event) => setCreateForm({ ...createForm, landUsePurpose: event.target.value })}
            required
          />
        </label>
        <label>
          Địa chỉ
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
        <label>
          Tỉnh/TP
          <input
            value={filterForm.provinceCode}
            onChange={(event) => setFilterForm({ ...filterForm, provinceCode: event.target.value })}
          />
        </label>
        <label>
          Quận/Huyện
          <input
            value={filterForm.districtName}
            onChange={(event) => setFilterForm({ ...filterForm, districtName: event.target.value })}
          />
        </label>
        <label>
          Xã/Phường
          <input
            value={filterForm.communeName}
            onChange={(event) => setFilterForm({ ...filterForm, communeName: event.target.value })}
          />
        </label>
        <button type="button" onClick={() => void loadLands()} disabled={loading}>
          Lọc danh sách
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Chưa có dữ liệu thửa đất.</div>
      ) : (
        items.map((item) => (
          <div className="card" key={item.id}>
            <div className="card-title-row">
              <strong>{item.parcelCode}</strong>
              <span className="badge">{item.landUsePurpose}</span>
            </div>
            <div>Khu vực: {item.provinceCode} / {item.districtName} / {item.communeName}</div>
            <div>Số tờ / số thửa: {item.mapSheetNumber} / {item.parcelNumber}</div>
            <div>Diện tích: {item.area} m²</div>
            <div>Địa chỉ: {item.address}</div>
            <div>Chủ sử dụng: {item.owner ? `${item.owner.fullName} (${item.owner.email})` : 'Chưa gán'}</div>
            <div className="action-row">
              <button type="button" onClick={() => startEdit(item)} disabled={loading}>
                Sửa
              </button>
            </div>
          </div>
        ))
      )}

      {editId && (
        <form className="card form-grid-4" onSubmit={onUpdate}>
          <h3>Cập nhật thửa đất</h3>
          <label>
            Mã thửa
            <input
              value={editForm.parcelCode}
              onChange={(event) => setEditForm({ ...editForm, parcelCode: event.target.value })}
              required
            />
          </label>
          <label>
            Tỉnh/TP
            <input
              value={editForm.provinceCode}
              onChange={(event) => setEditForm({ ...editForm, provinceCode: event.target.value })}
              required
            />
          </label>
          <label>
            Quận/Huyện
            <input
              value={editForm.districtName}
              onChange={(event) => setEditForm({ ...editForm, districtName: event.target.value })}
              required
            />
          </label>
          <label>
            Xã/Phường
            <input
              value={editForm.communeName}
              onChange={(event) => setEditForm({ ...editForm, communeName: event.target.value })}
              required
            />
          </label>
          <label>
            Số tờ
            <input
              value={editForm.mapSheetNumber}
              onChange={(event) => setEditForm({ ...editForm, mapSheetNumber: event.target.value })}
              required
            />
          </label>
          <label>
            Số thửa
            <input
              value={editForm.parcelNumber}
              onChange={(event) => setEditForm({ ...editForm, parcelNumber: event.target.value })}
              required
            />
          </label>
          <label>
            Diện tích
            <input value={editForm.area} onChange={(event) => setEditForm({ ...editForm, area: event.target.value })} required />
          </label>
          <label>
            Loại đất
            <input
              value={editForm.landUsePurpose}
              onChange={(event) => setEditForm({ ...editForm, landUsePurpose: event.target.value })}
              required
            />
          </label>
          <label>
            Địa chỉ
            <input value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} required />
          </label>
          {user?.role === 'ADMIN' && (
            <label>
              Chủ sử dụng
              <select value={editForm.ownerUserId} onChange={(event) => setEditForm({ ...editForm, ownerUserId: event.target.value })}>
                <option value="">Không gán</option>
                {users.map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.fullName} ({item.email})
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="action-row">
            <button type="submit" disabled={loading}>
              Lưu thay đổi
            </button>
            <button type="button" onClick={() => setEditId(null)} disabled={loading}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
