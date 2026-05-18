import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { ROLE_LABELS, UserRole } from '../auth/roles';
import { useToast } from '../ui/ToastContext';

type SummaryResponse = {
  role: string;
  summary: Record<string, Record<string, number>>;
};

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((item) => typeof item === 'number');
}

const GROUP_LABELS: Record<string, string> = {
  users: 'Người dùng',
  organizations: 'Đơn vị',
  lands: 'Thửa đất',
  registrations: 'Hồ sơ đăng ký',
  transfers: 'Hồ sơ biến động',
  queue: 'Hàng đợi xử lý'
};

const METRIC_LABELS: Record<string, string> = {
  total: 'Tổng số',
  active: 'Đang hoạt động',
  locked: 'Đã khóa',
  inactive: 'Ngừng hoạt động',
  pending: 'Chờ xử lý',
  approved: 'Đã phê duyệt',
  rejected: 'Bị từ chối',
  supplement: 'Cần bổ sung',
  appraising: 'Đang thẩm định',
  waitingApproval: 'Chờ phê duyệt',
  submitted: 'Mới nộp',
  accepted: 'Đã tiếp nhận',
  pendingCommune: 'Chờ xác nhận cấp xã',
  confirmedCommune: 'Đã xác nhận cấp xã',
  completed: 'Đã hoàn tất'
};

const WORD_LABELS: Record<string, string> = {
  queue: 'hàng đợi',
  waiting: 'chờ',
  approval: 'phê duyệt',
  appraising: 'thẩm định',
  submitted: 'mới nộp',
  accepted: 'đã tiếp nhận',
  pending: 'chờ xử lý',
  commune: 'cấp xã',
  transfers: 'biến động',
  registrations: 'hồ sơ'
};

export function toReadableLabel(raw: string) {
  const normalized = raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return raw;
  return tokens
    .map((token: string) => WORD_LABELS[token] ?? token)
    .join(' ')
    .replace(/^\w/, (c: string) => c.toUpperCase());
}

function toRoleLabel(role: string) {
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function toGroupLabel(groupName: string) {
  return GROUP_LABELS[groupName] ?? toReadableLabel(groupName);
}

export function toMetricLabel(metricName: string) {
  return METRIC_LABELS[metricName] ?? toReadableLabel(metricName);
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await apiGet<SummaryResponse>('/dashboard/summary');
      setData(summary);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được bảng điều khiển');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Bảng điều khiển theo vai trò</h2>
          <p className="section-subtitle">
            Theo dõi nhanh khối lượng hồ sơ và trạng thái xử lý theo quyền hiện tại.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {!data ? (
        <div className="empty-state">Đang tải dữ liệu bảng điều khiển...</div>
      ) : (
        <>
          <div className="card">
            <div className="card-title-row">
              <strong>Vai trò hiện tại</strong>
              <span className="badge badge-success">{toRoleLabel(data.role)}</span>
            </div>
            <p className="muted">Số liệu bên dưới được lọc theo đúng phạm vi quyền truy cập của bạn.</p>
          </div>
          {Object.entries(data.summary).map(([groupName, groupValue]) => (
            <div className="card" key={groupName}>
              <h3>{toGroupLabel(groupName)}</h3>
              {isNumberRecord(groupValue) ? (
                <div className="stats-grid">
                  {Object.entries(groupValue).map(([metricName, metricValue]) => (
                    <div className="metric-item" key={metricName}>
                      <span>{toMetricLabel(metricName)}</span>
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
