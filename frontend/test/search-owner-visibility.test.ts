import { describe, expect, it } from 'vitest';
import { formatOwnerDisplay } from '../src/pages/SearchLandPage';

describe('search owner visibility', () => {
  const owner = {
    userId: 'usr-001',
    fullName: 'Nguyễn Văn A',
    email: 'citizen@urbanchain.vn'
  };

  it('masks owner email for citizen/business', () => {
    expect(formatOwnerDisplay(owner, 'CITIZEN')).toBe('Nguyễn Văn A (Email ẩn theo phân quyền)');
    expect(formatOwnerDisplay(owner, 'BUSINESS')).toBe('Nguyễn Văn A (Email ẩn theo phân quyền)');
  });

  it('shows owner email for officer/admin roles', () => {
    expect(formatOwnerDisplay(owner, 'RECEPTION_OFFICER')).toBe('Nguyễn Văn A (citizen@urbanchain.vn)');
    expect(formatOwnerDisplay(owner, 'ADMIN')).toBe('Nguyễn Văn A (citizen@urbanchain.vn)');
  });

  it('shows empty owner fallback', () => {
    expect(formatOwnerDisplay(null, 'ADMIN')).toBe('Chưa gán');
    expect(formatOwnerDisplay(null, undefined)).toBe('Chưa gán');
  });
});

