import { describe, expect, it } from 'vitest';
import { getAccountStatusLabel } from '../src/ui/statusLabels';

describe('account status labels', () => {
  it('maps technical status codes to Vietnamese labels', () => {
    expect(getAccountStatusLabel('ACTIVE')).toBe('Đang hoạt động');
    expect(getAccountStatusLabel('LOCKED')).toBe('Đã khóa');
    expect(getAccountStatusLabel('INACTIVE')).toBe('Ngừng hoạt động');
  });

  it('keeps unknown status untouched', () => {
    expect(getAccountStatusLabel('PENDING_REVIEW')).toBe('PENDING_REVIEW');
  });
});
