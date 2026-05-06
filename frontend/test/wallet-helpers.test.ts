import { describe, expect, it } from 'vitest';
import {
  getWalletStatusBadgeClass,
  getWalletStatusLabel,
  isLikelyEvmAddress,
  normalizeWalletAddressInput,
  shortenWalletAddress,
  WALLET_NETWORK_OPTIONS
} from '../src/pages/walletHelpers';

describe('wallet helpers', () => {
  it('validates and normalizes EVM wallet address input', () => {
    const normalized = normalizeWalletAddressInput(' 0x1234567890123456789012345678901234567890 ');
    expect(normalized).toBe('0x1234567890123456789012345678901234567890');
    expect(isLikelyEvmAddress(normalized)).toBe(true);
    expect(isLikelyEvmAddress('not-a-wallet')).toBe(false);
  });

  it('maps wallet status labels and badge styles to Vietnamese UI', () => {
    expect(getWalletStatusLabel('PENDING_VERIFICATION')).toBe('Chờ xác minh');
    expect(getWalletStatusLabel('VERIFIED')).toBe('Đã xác minh');
    expect(getWalletStatusLabel('INACTIVE')).toBe('Ngừng hoạt động');
    expect(getWalletStatusBadgeClass('PENDING_VERIFICATION')).toBe('badge-warning');
    expect(getWalletStatusBadgeClass('VERIFIED')).toBe('badge-success');
    expect(getWalletStatusBadgeClass('INACTIVE')).toBe('badge-danger');
  });

  it('shortens wallet address and keeps supported network options', () => {
    expect(shortenWalletAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
    expect(shortenWalletAddress('short')).toBe('short');

    const values = WALLET_NETWORK_OPTIONS.map((item) => item.value);
    expect(values).toEqual(['SEPOLIA', 'HARDHAT', 'GANACHE']);
  });
});
