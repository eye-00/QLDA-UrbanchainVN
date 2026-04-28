import { FormEvent, useState } from 'react';
import { apiGet } from '../lib/api';

type LandItem = {
  landCode: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: number;
  landUsePurpose: string;
  address: string;
  ownerDisplayName: string;
  status: string;
  txHash?: string;
};

type SearchResult = {
  items: LandItem[];
  total: number;
};

export function SearchLandPage() {
  const [query, setQuery] = useState('LAND');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const data = await apiGet<SearchResult>(`/lands/search?q=${encodeURIComponent(query)}`);
      setResult(data);
      if (data.total === 0) setMessage('Không tìm thấy dữ liệu phù hợp.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tra cứu thất bại');
    }
  }

  return (
    <section>
      <h2>Tra cứu thửa đất</h2>
      <form onSubmit={onSubmit} className="card row-gap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập mã thửa đất, địa chỉ, số thửa..." />
        <button type="submit">Tra cứu</button>
      </form>
      {message && <p className="notice">{message}</p>}
      {result && result.items.map((item) => (
        <div className="card" key={item.landCode}>
          <div className="card-title-row">
            <strong>{item.landCode}</strong>
            <span className="badge">{item.status}</span>
          </div>
          <div>Chủ sử dụng hiện tại: {item.ownerDisplayName}</div>
          <div>Số thửa: {item.parcelNumber} | Số tờ: {item.mapSheetNumber}</div>
          <div>Diện tích: {item.area} m²</div>
          <div>Mục đích: {item.landUsePurpose}</div>
          <div>Địa chỉ: {item.address}</div>
          {item.txHash && <div>Mã giao dịch (transaction hash): {item.txHash}</div>}
        </div>
      ))}
    </section>
  );
}
