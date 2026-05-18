import { describe, expect, it } from 'vitest';
import {
  buildCommuneConfirmPayload,
  buildRegistrationReviewQuery,
  buildSupplementRequestPayload,
  getAllowedReviewActionsByStatus,
  getReviewPermissions,
  getReviewStepsByStatus,
  isActionAllowedForStatus,
  isBlockchainSyncReady,
  isCommuneConfirmReady,
  isFutureDateTime,
  isTaxTransferReady,
  parseMissingItems,
  requiresActionNote,
  toBlockchainDisplayValue
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

  it('validates commune confirm payload requirements', () => {
    expect(isCommuneConfirmReady('Đủ điều kiện xác nhận', 'fil_001')).toBe(true);
    expect(isCommuneConfirmReady('ok', 'fil_001')).toBe(false);
    expect(isCommuneConfirmReady('Đủ điều kiện xác nhận', '')).toBe(false);

    expect(
      buildCommuneConfirmPayload({
        confirmed: true,
        legalBasisCode: '151/2025-ND-CP|3380/QD-BNNMT',
        note: '  UBND cấp xã xác nhận thông tin hồ sơ  ',
        evidenceFileId: '  fil_001  '
      })
    ).toEqual({
      confirmed: true,
      legalBasisCode: '151/2025-ND-CP|3380/QD-BNNMT',
      notes: 'UBND cấp xã xác nhận thông tin hồ sơ',
      evidenceFileId: 'fil_001'
    });
  });

  it('validates supplement request payload requirements', () => {
    const now = new Date('2026-05-13T10:00:00.000Z');
    expect(parseMissingItems('Thiếu giấy A\n\nThiếu giấy B')).toEqual(['Thiếu giấy A', 'Thiếu giấy B']);
    expect(isFutureDateTime('2026-05-13T18:00:00.000Z', now)).toBe(true);
    expect(isFutureDateTime('2026-05-13T09:59:59.000Z', now)).toBe(false);
    expect(isFutureDateTime('', now)).toBe(false);

    expect(
      buildSupplementRequestPayload({
        legalBasisCode: '151/2025-ND-CP|3380/QD-BNNMT',
        note: '  Cần bổ sung hồ sơ  ',
        missingItemsInput: 'Thiếu giấy A\nThiếu giấy B',
        deadlineAt: '2026-05-20T09:00:00.000Z'
      })
    ).toEqual({
      legalBasisCode: '151/2025-ND-CP|3380/QD-BNNMT',
      note: 'Cần bổ sung hồ sơ',
      missingItems: ['Thiếu giấy A', 'Thiếu giấy B'],
      deadlineAt: '2026-05-20T09:00:00.000Z'
    });
  });

  it('returns permission matrix by role', () => {
    expect(getReviewPermissions('RECEPTION_OFFICER').canAccept).toBe(true);
    expect(getReviewPermissions('RECEPTION_OFFICER').canApprove).toBe(false);
    expect(getReviewPermissions('LAND_REGISTRY_OFFICER').canTaxTransfer).toBe(true);
    expect(getReviewPermissions('TAX_OFFICER').canTaxTransfer).toBe(false);
    expect(getReviewPermissions('TAX_OFFICER').canConfirmPaymentObligation).toBe(true);
    expect(getReviewPermissions('LAND_REGISTRY_OFFICER').canConfirmPaymentObligation).toBe(false);
    expect(getReviewPermissions('LAND_REGISTRY_OFFICER').canCadastralUpdate).toBe(true);
    expect(getReviewPermissions('APPROVAL_AUTHORITY').canBlockchainSync).toBe(true);
    expect(getReviewPermissions('AUDITOR').canAccept).toBe(false);
    expect(getReviewPermissions('CITIZEN').canAccept).toBe(false);
    expect(getReviewPermissions('ADMIN').canApprove).toBe(true);
    expect(getReviewPermissions('ADMIN').canConfirmPaymentObligation).toBe(true);
    expect(getReviewPermissions('ADMIN').canBlockchainSync).toBe(false);
  });

  it('maps status to workflow steps', () => {
    const submitted = getReviewStepsByStatus('CHO_TIEP_NHAN');
    expect(submitted[1].state).toBe('current');

    const approved = getReviewStepsByStatus('DA_CAP');
    expect(approved[6].state).toBe('current');
    expect(approved[0].state).toBe('done');

    const blockchain = getReviewStepsByStatus('DA_GHI_BLOCKCHAIN');
    expect(blockchain[6].state).toBe('current');
  });

  it('maps status to allowed actions', () => {
    expect(isActionAllowedForStatus('accept', 'CHO_TIEP_NHAN')).toBe(true);
    expect(isActionAllowedForStatus('approve', 'CHO_TIEP_NHAN')).toBe(false);
    expect(isActionAllowedForStatus('approve', 'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH')).toBe(true);
    expect(isActionAllowedForStatus('communeConfirm', 'DA_TIEP_NHAN')).toBe(true);
    expect(isActionAllowedForStatus('communeConfirm', 'CHO_XAC_NHAN_CAP_XA')).toBe(true);
    expect(isActionAllowedForStatus('cadastralUpdate', 'DA_KY_CAP')).toBe(true);
    expect(isActionAllowedForStatus('blockchainSync', 'DA_CAP_NHAT_HO_SO_DIA_CHINH')).toBe(true);
    expect(isActionAllowedForStatus('blockchainSync', 'DA_CAP')).toBe(false);
    expect(isActionAllowedForStatus('blockchainSync', 'CHO_KY_CAP')).toBe(false);

    expect(getAllowedReviewActionsByStatus('DA_XAC_NHAN_CAP_XA')).toContain('taxTransfer');
    expect(getAllowedReviewActionsByStatus('DA_XAC_NHAN_CAP_XA')).toContain('requestSupplement');
    expect(getAllowedReviewActionsByStatus('DA_XAC_NHAN_CAP_XA')).not.toContain('approve');
  });

  it('formats blockchain display values with fallback', () => {
    expect(toBlockchainDisplayValue(null)).toBe('Chưa có');
    expect(toBlockchainDisplayValue(undefined)).toBe('Chưa có');
    expect(toBlockchainDisplayValue('')).toBe('Chưa có');
    expect(toBlockchainDisplayValue('0xabc')).toBe('0xabc');
    expect(toBlockchainDisplayValue(1201)).toBe('1201');
  });
});
