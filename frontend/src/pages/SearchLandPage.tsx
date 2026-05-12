import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api';
import { loadProvinceOptions, type ProvinceOption } from '../lib/vnAddress';
import { useAuth } from '../auth/AuthContext';
import { CITIZEN_ROLES, type UserRole } from '../auth/roles';

type LandItem = {
  id: string;
  parcelCode: string;
  provinceCode: string;
  communeName: string;
  parcelNumber: string;
  mapSheetNumber: string;
  area: number;
  landUsePurpose: string;
  address: string;
  owner: { userId: string; fullName: string; email: string } | null;
};

type SearchResult = {
  items: LandItem[];
  total: number;
};

export function formatOwnerDisplay(owner: LandItem['owner'], role: UserRole | undefined) {
  if (!owner) return 'Chưa gán';
  if (role && CITIZEN_ROLES.includes(role)) {
    return `${owner.fullName} (Email ẩn theo phân quyền)`;
  }
  return `${owner.fullName} (${owner.email})`;
}

export function SearchLandPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);

  useEffect(() => {
    loadProvinceOptions()
      .then(setProvinceOptions)
      .catch(() => setProvinceOptions([]));
  }, []);

  const provinceMap = useMemo(() => {
    return new Map(provinceOptions.map((item) => [item.code, item.name] as const));
  }, [provinceOptions]);

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
      <div className="section-header">
        <div>
          <h2>Tra cứu thửa đất</h2>
          <p className="section-subtitle">
            Tìm theo mã thửa, địa chỉ hoặc thông tin chủ sử dụng để xem hồ sơ cơ bản.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="card row-gap">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập mã thửa đất, địa chỉ, số thửa..." />
        <button type="submit">Tra cứu</button>
      </form>
      {message && <p className="notice">{message}</p>}
      {result && result.items.length > 0 && (
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
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>{item.parcelCode}</div>
                      <div className="muted">{item.address}</div>
                    </td>
                    <td>{provinceMap.get(item.provinceCode) ?? item.provinceCode} / {item.communeName}</td>
                    <td>{item.mapSheetNumber} / {item.parcelNumber}</td>
                    <td>{item.area} m²</td>
                    <td>{item.landUsePurpose}</td>
                    <td>{formatOwnerDisplay(item.owner, user?.role)}</td>
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
