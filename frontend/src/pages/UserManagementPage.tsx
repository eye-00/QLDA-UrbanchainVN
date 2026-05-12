import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { ROLE_LABELS, UserRole } from '../auth/roles';
import { useToast } from '../ui/ToastContext';
import { getAccountStatusLabel } from '../ui/statusLabels';
import {
  buildUserCreatePayload,
  buildUserQueryString,
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
  'TAX_OFFICER',
  'APPROVAL_AUTHORITY',
  'AUDITOR',
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
  const navigate = useNavigate();
  const [items, setItems] = useState<UserItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialCreateForm);
  const [filters, setFilters] = useState(initialFilter);

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
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách người dùng');
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
      <div className="section-header">
        <div>
          <h2>Quản lý người dùng</h2>
          <p className="section-subtitle">
            Tạo, cập nhật, khóa/mở khóa tài khoản và lọc danh sách theo vai trò hoặc đơn vị.
          </p>
        </div>
      </div>

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
                {ROLE_LABELS[role]}
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
          {loading ? 'Đang xử lý...' : 'Tạo người dùng'}
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
                {ROLE_LABELS[role]}
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
            <option value="ACTIVE">{getAccountStatusLabel('ACTIVE')}</option>
            <option value="LOCKED">{getAccountStatusLabel('LOCKED')}</option>
          </select>
        </label>
        <button type="button" onClick={() => void loadUsers()} disabled={loading}>
          Lọc danh sách
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Chưa có dữ liệu người dùng.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Đơn vị</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.userId}>
                    <td>{item.fullName}</td>
                    <td>{item.email}</td>
                    <td>{ROLE_LABELS[item.role]}</td>
                    <td>{item.organization ? `${item.organization.code} - ${item.organization.name}` : 'Chưa gán'}</td>
                    <td>
                      <span className={`badge ${item.status === 'LOCKED' ? 'badge-danger' : 'badge-success'}`}>
                        {getAccountStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => navigate(`/admin/users/${item.userId}/edit`)}
                          disabled={loading}
                        >
                          Cập nhật
                        </button>
                        <button type="button" onClick={() => void onToggleStatus(item)} disabled={loading}>
                          {item.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      </div>
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
