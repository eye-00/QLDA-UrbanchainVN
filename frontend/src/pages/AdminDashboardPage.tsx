import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api';

type Summary = {
  registrations: { total: number; pending: number; approved: number; rejected: number; supplement: number };
  transfers: { total: number; pending: number; completed: number; rejected: number };
  blockchain: { latestTxCount: number };
};

type RegistrationItem = {
  id: string;
  code: string;
  ownerFullName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  address: string;
  status: string;
  notes: string[];
  landCode?: string;
};

type RegistrationListResponse = { items: RegistrationItem[]; total: number };

type ApproveResult = {
  registration: RegistrationItem;
  land: { landCode: string; txHash?: string };
};

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    const [summaryData, registrations] = await Promise.all([
      apiGet<Summary>('/dashboard/summary'),
      apiGet<RegistrationListResponse>('/registrations')
    ]);
    setSummary(summaryData);
    setItems(registrations.items);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function requestSupplement(id: string) {
    setLoading(true);
    setMessage('');
    try {
      await apiPost(`/registrations/${id}/request-supplement`, {
        note: 'Cần bổ sung giấy tờ nguồn gốc sử dụng đất'
      });
      setMessage('Đã cập nhật trạng thái cần bổ sung hồ sơ.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    setLoading(true);
    setMessage('');
    try {
      const result = await apiPost<ApproveResult>(`/registrations/${id}/approve`, {
        note: 'Hồ sơ hợp lệ, chuyển bước cấp bản ghi đất đai'
      });
      setMessage(`Đã phê duyệt ${result.registration.code} và tạo thửa đất ${result.land.landCode}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể phê duyệt hồ sơ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Dashboard cán bộ</h2>
      {!summary ? (
        <p>Đang tải...</p>
      ) : (
        <div className="grid-4">
          <div className="card"><strong>Tổng hồ sơ</strong><div>{summary.registrations.total}</div></div>
          <div className="card"><strong>Chờ xử lý</strong><div>{summary.registrations.pending}</div></div>
          <div className="card"><strong>Đã cấp</strong><div>{summary.registrations.approved}</div></div>
          <div className="card"><strong>Tx blockchain</strong><div>{summary.blockchain.latestTxCount}</div></div>
        </div>
      )}

      {message && <p className="notice">{message}</p>}

      <div className="section-header">
        <h3>Hồ sơ đăng ký lần đầu</h3>
        <button type="button" onClick={() => load().catch(console.error)} disabled={loading}>Làm mới</button>
      </div>

      {items.map((item) => (
        <div className="card" key={item.id}>
          <div className="card-title-row">
            <strong>{item.code}</strong>
            <span className="badge">{item.status}</span>
          </div>
          <div>Chủ sử dụng: {item.ownerFullName}</div>
          <div>Số thửa: {item.parcelNumber} | Số tờ: {item.mapSheetNumber}</div>
          <div>Địa chỉ: {item.address}</div>
          <div>Ghi chú mới nhất: {item.notes[item.notes.length - 1]}</div>
          {item.landCode && <div>Mã đất đã cấp: {item.landCode}</div>}
          <div className="action-row">
            <button type="button" onClick={() => void requestSupplement(item.id)} disabled={loading}>Yêu cầu bổ sung</button>
            <button type="button" onClick={() => void approve(item.id)} disabled={loading || item.status === 'DA_CAP'}>
              {item.status === 'DA_CAP' ? 'Đã cấp' : 'Phê duyệt'}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
