import { describe, expect, it } from 'vitest';
import { toGroupLabel, toMetricLabel, toReadableLabel } from '../src/pages/AdminDashboardPage';

describe('dashboard labels localization', () => {
  it('maps known dashboard groups and metrics to Vietnamese labels', () => {
    expect(toGroupLabel('users')).toBe('Người dùng');
    expect(toGroupLabel('queue')).toBe('Hàng đợi xử lý');
    expect(toMetricLabel('waitingApproval')).toBe('Chờ phê duyệt');
    expect(toMetricLabel('pendingCommune')).toBe('Chờ xác nhận cấp xã');
  });

  it('formats unknown keys into readable Vietnamese-style text', () => {
    expect(toReadableLabel('processingQueue')).toBe('Processing hàng đợi');
    expect(toMetricLabel('unknownMetricKey')).toBe('Unknown metric key');
  });
});
