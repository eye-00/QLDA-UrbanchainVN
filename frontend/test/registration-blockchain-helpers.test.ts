import { describe, expect, it } from 'vitest';
import { canViewBlockchainStatus, formatShortTxHash, resolveBlockchainSyncBadge } from '../src/pages/registrationBlockchainHelpers';

describe('registration blockchain helpers', () => {
  it('maps role access for blockchain status API', () => {
    expect(canViewBlockchainStatus('LAND_REGISTRY_OFFICER')).toBe(true);
    expect(canViewBlockchainStatus('APPROVAL_AUTHORITY')).toBe(true);
    expect(canViewBlockchainStatus('ADMIN')).toBe(true);
    expect(canViewBlockchainStatus('RECEPTION_OFFICER')).toBe(false);
    expect(canViewBlockchainStatus('TAX_OFFICER')).toBe(false);
  });

  it('formats tx hash safely', () => {
    expect(formatShortTxHash('0x12345678901234567890abcdef')).toBe('0x123456789012...abcdef');
    expect(formatShortTxHash('0x1234')).toBe('0x1234');
    expect(formatShortTxHash(null)).toBeNull();
  });

  it('resolves sync badge by on/off-chain state', () => {
    expect(resolveBlockchainSyncBadge(true, true, true)).toEqual({
      className: 'badge-success',
      label: 'Đồng bộ'
    });
    expect(resolveBlockchainSyncBadge(false, true, false)).toEqual({
      className: 'badge-warning',
      label: 'Thiếu bản ghi on-chain'
    });
    expect(resolveBlockchainSyncBadge(false, false, true)).toEqual({
      className: 'badge-danger',
      label: 'Lệch với dữ liệu off-chain'
    });
  });
});
