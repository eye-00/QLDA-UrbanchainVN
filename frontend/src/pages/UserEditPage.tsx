import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROLE_LABELS, UserRole } from '../auth/roles';
import { apiGet, apiPatch } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import { buildUserUpdatePayload } from './sprint2PageHelpers';

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

const initialEditForm = {
  fullName: '',
  email: '',
  role: 'RECEPTION_OFFICER' as UserRole,
  organizationId: ''
};

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [form, setForm] = useState(initialEditForm);

  function goBackToList() {
    navigate('/admin/users');
  }

  async function loadPageData() {
    if (!id) {
      setLoadError('Không tìm thấy mã người dùng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [orgData, userData] = await Promise.all([
        apiGet<OrganizationListResponse>('/organizations?includeInactive=true'),
        apiGet<UserListResponse>('/users?pageSize=100')
      ]);
      const targetUser = userData.items.find((item) => item.userId === id);
      if (!targetUser) {
        setLoadError('Không tìm thấy thông tin người dùng.');
        return;
      }

      setOrganizations(orgData.items);
      setForm({
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        organizationId: targetUser.organizationId ?? ''
      });
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, [id]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      await apiPatch(`/users/${id}`, buildUserUpdatePayload(form));
      showToast('success', 'Đã cập nhật người dùng');
      goBackToList();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được người dùng');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Cập nhật người dùng</h2>
        <p className="section-subtitle">Đang tải dữ liệu...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="card row-gap">
        <h2>Cập nhật người dùng</h2>
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
          <h2>Cập nhật người dùng</h2>
          <p className="section-subtitle">Chỉnh sửa thông tin tài khoản và quay lại danh sách nhanh.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goBackToList}>
          Quay lại
        </button>
      </div>

      <form className="card form-grid-4" onSubmit={onSubmit}>
        <label>
          Họ tên
          <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
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
            {organizations.map((item) => (
              <option value={item.id} key={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
        </label>
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
