import { FormEvent, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import { getAccountStatusLabel } from '../ui/statusLabels';
import {
  buildOrganizationCreatePayload,
  buildOrganizationUpdatePayload
} from './sprint2PageHelpers';

type OrganizationItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
};

type OrganizationListResponse = {
  items: OrganizationItem[];
  total: number;
};

type UserItem = {
  userId: string;
  fullName: string;
  email: string;
  organizationId: string | null;
};

type UserListResponse = {
  items: UserItem[];
  total: number;
};

const initialCreateForm = {
  code: '',
  name: '',
  description: ''
};

export function OrganizationManagementPage() {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialCreateForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true
  });
  const [assignment, setAssignment] = useState({
    userId: '',
    organizationId: ''
  });

  async function loadData() {
    setLoading(true);
    try {
      const [orgResponse, userResponse] = await Promise.all([
        apiGet<OrganizationListResponse>('/organizations?includeInactive=true'),
        apiGet<UserListResponse>('/users?pageSize=100')
      ]);
      setOrganizations(orgResponse.items);
      setUsers(userResponse.items);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được dữ liệu đơn vị');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost('/organizations', buildOrganizationCreatePayload(form));
      showToast('success', 'Đã tạo đơn vị');
      setForm(initialCreateForm);
      await loadData();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tạo được đơn vị');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: OrganizationItem) {
    setEditId(item.id);
    setEditForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      isActive: item.isActive
    });
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editId) return;
    setLoading(true);
    try {
      await apiPatch(`/organizations/${editId}`, buildOrganizationUpdatePayload(editForm));
      showToast('success', 'Đã cập nhật đơn vị');
      setEditId(null);
      await loadData();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được đơn vị');
    } finally {
      setLoading(false);
    }
  }

  async function onSoftDelete(id: string) {
    setLoading(true);
    try {
      await apiDelete(`/organizations/${id}`);
      showToast('success', 'Đã vô hiệu hóa đơn vị');
      await loadData();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không xóa được đơn vị');
    } finally {
      setLoading(false);
    }
  }

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignment.userId || !assignment.organizationId) {
      showToast('error', 'Vui lòng chọn người dùng và đơn vị');
      return;
    }
    setLoading(true);
    try {
      await apiPatch(`/users/${assignment.userId}`, {
        organizationId: assignment.organizationId
      });
      showToast('success', 'Đã gán người dùng vào đơn vị');
      await loadData();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không gán được người dùng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Quản lý đơn vị</h2>
      <form className="card form-grid-4" onSubmit={onCreate}>
        <label>
          Mã đơn vị
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        </label>
        <label>
          Tên đơn vị
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Mô tả
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Không bắt buộc"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Tạo đơn vị'}
        </button>
      </form>

      <form className="card form-grid-4" onSubmit={onAssign}>
        <h3>Gán người dùng vào đơn vị</h3>
        <label>
          Người dùng
          <select value={assignment.userId} onChange={(event) => setAssignment({ ...assignment, userId: event.target.value })}>
            <option value="">Chọn người dùng</option>
            {users.map((item) => (
              <option key={item.userId} value={item.userId}>
                {item.fullName} ({item.email})
              </option>
            ))}
          </select>
        </label>
        <label>
          Đơn vị
          <select
            value={assignment.organizationId}
            onChange={(event) => setAssignment({ ...assignment, organizationId: event.target.value })}
          >
            <option value="">Chọn đơn vị</option>
            {organizations
              .filter((item) => item.isActive)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          Gán người dùng
        </button>
      </form>

      {organizations.length === 0 ? (
        <div className="empty-state">Chưa có đơn vị nào.</div>
      ) : (
        organizations.map((item) => (
          <div className="card" key={item.id}>
            <div className="card-title-row">
              <strong>
                {item.code} - {item.name}
              </strong>
              <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                {getAccountStatusLabel(item.isActive ? 'ACTIVE' : 'INACTIVE')}
              </span>
            </div>
            <div>Mô tả: {item.description ?? 'Không có'}</div>
            <div>Số người dùng: {item.userCount}</div>
            <div className="action-row">
              <button type="button" onClick={() => startEdit(item)} disabled={loading}>
                Sửa
              </button>
              <button type="button" onClick={() => void onSoftDelete(item.id)} disabled={loading || !item.isActive}>
                Vô hiệu hóa
              </button>
            </div>
          </div>
        ))
      )}

      {editId && (
        <form className="card form-grid-4" onSubmit={onUpdate}>
          <h3>Cập nhật đơn vị</h3>
          <label>
            Mã đơn vị
            <input value={editForm.code} onChange={(event) => setEditForm({ ...editForm, code: event.target.value })} />
          </label>
          <label>
            Tên đơn vị
            <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
          </label>
          <label>
            Mô tả
            <input
              value={editForm.description}
              onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(event) => setEditForm({ ...editForm, isActive: event.target.checked })}
            />
            Kích hoạt đơn vị
          </label>
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
