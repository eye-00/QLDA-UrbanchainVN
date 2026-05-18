import { describe, expect, it } from 'vitest';
import {
  buildBlockchainSyncPayload,
  canOpenBlockchainSign,
  canUseCitizenSyncMode,
  canUseOfficerSyncMode,
  canViewBlockchainStatus,
  formatShortTxHash,
  isExpectedChainId,
  isWalletAddressMatch,
  mapBlockchainSyncErrorMessage,
  resolveBlockchainSyncBadge
} from '../src/pages/registrationBlockchainHelpers';

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

  it('builds sync payload for officer and citizen modes', () => {
    const officerPayload = buildBlockchainSyncPayload({
      legalBasisCode: 'QĐ3380-S4-OFFICER',
      syncMode: 'OFFICER_SERVICE_WALLET',
      cid: 'bafy-officer',
      metadataHash: '0xofficer',
      signerWalletAddress: '0x1111111111111111111111111111111111111111',
      signerChainId: 11155111,
      signingMessage: 'officer-sign',
      signature: '0xofficer-signature',
      walletAuthorizationId: 'swa_001'
    });
    expect(officerPayload).toMatchObject({
      syncMode: 'OFFICER_SERVICE_WALLET',
      walletAuthorizationId: 'swa_001'
    });

    const citizenPayload = buildBlockchainSyncPayload({
      legalBasisCode: 'QĐ3380-S4-CITIZEN',
      syncMode: 'CITIZEN_DIRECT_SIGN',
      cid: 'bafy-citizen',
      metadataHash: '0xcitizen',
      signerWalletAddress: '0x2222222222222222222222222222222222222222',
      signerChainId: 11155111,
      signingMessage: 'citizen-sign',
      signature: '0xcitizen-signature'
    });
    expect(citizenPayload).toMatchObject({
      syncMode: 'CITIZEN_DIRECT_SIGN'
    });
    expect('walletAuthorizationId' in citizenPayload).toBe(false);
  });

  it('checks wallet/chain guards and action readiness', () => {
    expect(canUseOfficerSyncMode('LAND_REGISTRY_OFFICER')).toBe(true);
    expect(canUseOfficerSyncMode('CITIZEN')).toBe(false);
    expect(canUseCitizenSyncMode('BUSINESS')).toBe(true);
    expect(canUseCitizenSyncMode('APPROVAL_AUTHORITY')).toBe(false);

    expect(isWalletAddressMatch('0xABCDEF', '0xabcdef')).toBe(true);
    expect(isWalletAddressMatch('0xABCDEF', '0x123456')).toBe(false);

    expect(isExpectedChainId(11155111, 11155111)).toBe(true);
    expect(isExpectedChainId(11155111, 1)).toBe(false);

    expect(canOpenBlockchainSign('DA_CAP_NHAT_HO_SO_DIA_CHINH')).toBe(true);
    expect(canOpenBlockchainSign('DA_CAP', '2026-05-12T00:00:00.000Z')).toBe(true);
    expect(canOpenBlockchainSign('DA_CAP', null)).toBe(false);
  });

  it('maps backend sync errors to Vietnamese microcopy', () => {
    expect(mapBlockchainSyncErrorMessage('walletAuthMissing: not found')).toContain('Ví công vụ');
    expect(mapBlockchainSyncErrorMessage('WALLET_MISMATCH: default wallet mismatch')).toContain('ví đã xác minh');
    expect(mapBlockchainSyncErrorMessage('WRONG_NETWORK: bad chain')).toContain('sai mạng');
    expect(mapBlockchainSyncErrorMessage('OWNERSHIP_DENIED')).toContain('không có quyền');
  });
});
