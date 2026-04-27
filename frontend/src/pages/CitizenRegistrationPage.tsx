import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

type RegistrationItem = {
  id: string;
  code: string;
  ownerFullName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  address: string;
  status: string;
  notes: string[];
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
  fullName: 'Nguyen Van A',
  identityNumber: '0482xxxxxxx',
  mapSheetNumber: '05',
  parcelNumber: '123',
  area: '120.5',
  landUsePurpose: 'ODT',
  address: '54 Nguyen Luong Bang',
  districtName: 'Lien Chieu',
  communeName: 'Hoa Khanh'
};

export function CitizenRegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadRegistrations() {
    try {
      const data = await apiGet<RegistrationListResponse>('/registrations');
      setItems(data.items);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void loadRegistrations();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        applicantId: 'usr_demo',
        landInfo: {
          provinceCode: '48',
          districtName: form.districtName,
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
      setMessage(`Đã tạo hồ sơ ${data.registrationCode} - trạng thái ${data.status}`);
      await loadRegistrations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tạo hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Đăng ký đất đai lần đầu</h2>
      <p>Luồng demo theo MVP: tạo hồ sơ, tiếp nhận, duyệt, cấp bản ghi đất đai.</p>
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
        <label>Diện tích
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </label>
        <label>Mục đích sử dụng đất
          <input value={form.landUsePurpose} onChange={(e) => setForm({ ...form, landUsePurpose: e.target.value })} />
        </label>
        <label>Quận/Huyện
          <input value={form.districtName} onChange={(e) => setForm({ ...form, districtName: e.target.value })} />
        </label>
        <label>Xã/Phường
          <input value={form.communeName} onChange={(e) => setForm({ ...form, communeName: e.target.value })} />
        </label>
        <label>Địa chỉ thửa đất
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo hồ sơ'}</button>
      </form>
      {message && <p className="notice">{message}</p>}

      <div className="section-header">
        <h3>Danh sách hồ sơ demo</h3>
        <button type="button" onClick={() => void loadRegistrations()}>Làm mới</button>
      </div>
      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="card-title-row">
            <strong>{item.code}</strong>
            <span className="badge">{item.status}</span>
          </div>
          <div>Chủ sử dụng: {item.ownerFullName}</div>
          <div>Số tờ / số thửa: {item.mapSheetNumber} / {item.parcelNumber}</div>
          <div>Địa chỉ: {item.address}</div>
          <div>Ghi chú mới nhất: {item.notes[item.notes.length - 1]}</div>
        </div>
      ))}
    </section>
  );
}
