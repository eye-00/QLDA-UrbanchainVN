import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPatch } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import { buildOrganizationUpdatePayload } from './sprint2PageHelpers';

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

const initialEditForm = {
  code: '',
  name: '',
  description: '',
  isActive: true
};

export function OrganizationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(initialEditForm);

  function goBackToList() {
    navigate('/admin/organizations');
  }

  async function loadOrganization() {
    if (!id) {
      setLoadError('Không tìm thấy mã đơn vị.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiGet<OrganizationListResponse>('/organizations?includeInactive=true');
      const target = data.items.find((item) => item.id === id);
      if (!target) {
        setLoadError('Không tìm thấy thông tin đơn vị.');
        return;
      }
      setForm({
        code: target.code,
        name: target.name,
        description: target.description ?? '',
        isActive: target.isActive
      });
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được thông tin đơn vị');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganization();
  }, [id]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      await apiPatch(`/organizations/${id}`, buildOrganizationUpdatePayload(form));
      showToast('success', 'Đã cập nhật đơn vị');
      goBackToList();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được đơn vị');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="card">
        <h2>Cập nhật đơn vị</h2>
        <p className="section-subtitle">Đang tải dữ liệu...</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="card row-gap">
        <h2>Cập nhật đơn vị</h2>
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
          <h2>Cập nhật đơn vị</h2>
          <p className="section-subtitle">Chỉnh sửa thông tin đơn vị trên màn hình riêng, thao tác liền mạch.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={goBackToList}>
          Quay lại
        </button>
      </div>

      <form className="card form-grid-4" onSubmit={onSubmit}>
        <label>
          Mã đơn vị
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        </label>
        <label>
          Tên đơn vị
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label className="field-span-2">
          Mô tả
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Không bắt buộc"
          />
        </label>
        <label className="checkbox-field field-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Kích hoạt đơn vị
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
