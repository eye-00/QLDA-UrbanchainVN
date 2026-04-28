import { describe, expect, it } from 'vitest';
import {
  buildRegistrationReviewQuery,
  getReviewPermissions,
  getReviewStepsByStatus,
  isBlockchainSyncReady,
  isTaxTransferReady,
  requiresActionNote
} from '../src/pages/registrationReviewHelpers';

describe('registration review helpers', () => {
  it('builds query string with optional filters', () => {
    expect(buildRegistrationReviewQuery({ keyword: ' HS-001 ', status: 'CHO_TIEP_NHAN' })).toBe(
      'keyword=HS-001&status=CHO_TIEP_NHAN&pageSize=50'
    );
    expect(buildRegistrationReviewQuery({ keyword: ' ', status: '' })).toBe('pageSize=50');
  });

  it('validates action inputs', () => {
    expect(requiresActionNote('supplement', 'cần bổ sung CCCD')).toBe(true);
    expect(requiresActionNote('reject', '   ')).toBe(false);
    expect(isTaxTransferReady('TAX-2026-001')).toBe(true);
    expect(isTaxTransferReady('')).toBe(false);
    expect(isBlockchainSyncReady('bafy123', '0xabc')).toBe(true);
    expect(isBlockchainSyncReady('bafy123', '  ')).toBe(false);
  });

  it('returns permission matrix by role', () => {
    expect(getReviewPermissions('RECEPTION_OFFICER').canAccept).toBe(true);
    expect(getReviewPermissions('RECEPTION_OFFICER').canApprove).toBe(false);
    expect(getReviewPermissions('LAND_REGISTRY_OFFICER').canTaxTransfer).toBe(true);
    expect(getReviewPermissions('APPROVAL_AUTHORITY').canBlockchainSync).toBe(true);
    expect(getReviewPermissions('CITIZEN').canAccept).toBe(false);
    expect(getReviewPermissions('ADMIN').canApprove).toBe(true);
  });

  it('maps status to workflow steps', () => {
    const submitted = getReviewStepsByStatus('CHO_TIEP_NHAN');
    expect(submitted[1].state).toBe('current');

    const approved = getReviewStepsByStatus('DA_CAP');
    expect(approved[6].state).toBe('current');
    expect(approved[0].state).toBe('done');
  });
});
