import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { UserRole } from '../auth/roles';
import { useToast } from '../ui/ToastContext';
import {
  buildUserCreatePayload,
  buildUserQueryString,
  buildUserUpdatePayload,
  getNextUserStatus
} from './sprint2PageHelpers';

type OrganizationOption = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

type OrganizationListResponse = {
  items: OrganizationOption[];
  total: number;
};

type UserItem = {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'LOCKED';
  organizationId: string | null;
  organization: { id: string; code: string; name: string } | null;
};

type UserListResponse = {
  items: UserItem[];
  total: number;
};

const roleOptions: UserRole[] = [
  'CITIZEN',
  'BUSINESS',
  'RECEPTION_OFFICER',
  'COMMUNE_OFFICER',
  'LAND_REGISTRY_OFFICER',
  'APPROVAL_AUTHORITY',
  'ADMIN'
];

const initialCreateForm = {
  fullName: '',
  email: '',
  password: 'StrongPassword@123',
  role: 'RECEPTION_OFFICER' as UserRole,
  organizationId: ''
};

const initialFilter = {
  keyword: '',
  role: '',
  organizationId: '',
  status: ''
};

export function UserManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<UserItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialCreateForm);
  const [filters, setFilters] = useState(initialFilter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    email: string;
    role: UserRole;
    organizationId: string;
  }>({
    fullName: '',
    email: '',
    role: 'RECEPTION_OFFICER',
    organizationId: ''
  });

  const queryString = useMemo(() => {
    return buildUserQueryString(filters);
  }, [filters]);

  async function loadOrganizations() {
    const data = await apiGet<OrganizationListResponse>('/organizations?includeInactive=true');
    setOrganizations(data.items);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const path = queryString ? `/users?${queryString}` : '/users';
      const data = await apiGet<UserListResponse>(path);
      setItems(data.items);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách user');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadOrganizations(), loadUsers()]);
  }, []);

  async function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost<UserItem>('/users', buildUserCreatePayload(form));
      showToast('success', 'Đã tạo người dùng');
      setForm(initialCreateForm);
      await loadUsers();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tạo được người dùng');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user: UserItem) {
    setEditingId(user.userId);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? ''
    });
  }

  async function onUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      await apiPatch<UserItem>(`/users/${editingId}`, buildUserUpdatePayload(editForm));
      showToast('success', 'Đã cập nhật người dùng');
      setEditingId(null);
      await loadUsers();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được người dùng');
    } finally {
      setLoading(false);
    }
  }

  async function onToggleStatus(user: UserItem) {
    setLoading(true);
    try {
      const nextStatus = getNextUserStatus(user.status);
      await apiPatch<UserItem>(`/users/${user.userId}/status`, { status: nextStatus });
      showToast('success', nextStatus === 'LOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      await loadUsers();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật trạng thái người dùng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Quản lý người dùng</h2>
      <form className="card form-grid-4" onSubmit={onCreateUser}>
        <label>
          Họ tên
          <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label>
          Vai trò
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
            {roleOptions.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Đơn vị
          <select
            value={form.organizationId}
            onChange={(event) => setForm({ ...form, organizationId: event.target.value })}
          >
            <option value="">Không gán</option>
            {organizations
              .filter((item) => item.isActive)
              .map((item) => (
                <option value={item.id} key={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Tạo user'}
        </button>
      </form>

      <div className="card form-grid-4">
        <label>
          Từ khóa
          <input
            value={filters.keyword}
            onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
            placeholder="Tên hoặc email"
          />
        </label>
        <label>
          Vai trò
          <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="">Tất cả</option>
            {roleOptions.map((role) => (
              <option value={role} key={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Đơn vị
          <select
            value={filters.organizationId}
            onChange={(event) => setFilters({ ...filters, organizationId: event.target.value })}
          >
            <option value="">Tất cả</option>
            {organizations.map((item) => (
              <option value={item.id} key={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </label>
        <button type="button" onClick={() => void loadUsers()} disabled={loading}>
          Lọc danh sách
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Chưa có dữ liệu người dùng.</div>
      ) : (
        items.map((item) => (
          <div className="card" key={item.userId}>
            <div className="card-title-row">
              <strong>{item.fullName}</strong>
              <span className={`badge ${item.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>{item.status}</span>
            </div>
            <div>Email: {item.email}</div>
            <div>Vai trò: {item.role}</div>
            <div>Đơn vị: {item.organization ? `${item.organization.code} - ${item.organization.name}` : 'Chưa gán'}</div>
            <div className="action-row">
              <button type="button" onClick={() => startEdit(item)} disabled={loading}>
                Sửa
              </button>
              <button type="button" onClick={() => void onToggleStatus(item)} disabled={loading}>
                {item.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
              </button>
            </div>
          </div>
        ))
      )}

      {editingId && (
        <form className="card form-grid-4" onSubmit={onUpdateUser}>
          <h3>Cập nhật người dùng</h3>
          <label>
            Họ tên
            <input
              value={editForm.fullName}
              onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={editForm.email}
              onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
              required
            />
          </label>
          <label>
            Vai trò
            <select
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value as UserRole })}
            >
              {roleOptions.map((role) => (
                <option value={role} key={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Đơn vị
            <select
              value={editForm.organizationId}
              onChange={(event) => setEditForm({ ...editForm, organizationId: event.target.value })}
            >
              <option value="">Không gán</option>
              {organizations.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="action-row">
            <button type="submit" disabled={loading}>
              Lưu thay đổi
            </button>
            <button type="button" onClick={() => setEditingId(null)} disabled={loading}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
