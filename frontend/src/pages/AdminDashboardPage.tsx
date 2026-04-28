import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { useToast } from '../ui/ToastContext';

type SummaryResponse = {
  role: string;
  summary: Record<string, Record<string, number>>;
};

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((item) => typeof item === 'number');
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const summary = await apiGet<SummaryResponse>('/dashboard/summary');
      setData(summary);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được bảng điều khiển');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2>Bảng điều khiển theo vai trò</h2>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {!data ? (
        <div className="empty-state">Đang tải dữ liệu bảng điều khiển...</div>
      ) : (
        <>
          <div className="card">
            <strong>Vai trò hiện tại</strong>
            <div>{data.role}</div>
          </div>
          {Object.entries(data.summary).map(([groupName, groupValue]) => (
            <div className="card" key={groupName}>
              <h3>{groupName}</h3>
              {isNumberRecord(groupValue) ? (
                <div className="stats-grid">
                  {Object.entries(groupValue).map(([metricName, metricValue]) => (
                    <div className="metric-item" key={metricName}>
                      <span>{metricName}</span>
                      <strong>{metricValue}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Không có dữ liệu hiển thị.</div>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
