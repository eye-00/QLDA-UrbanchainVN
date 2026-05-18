import { describe, expect, it } from 'vitest';
import {
  getBlockchainResultStatusLabel,
  getDocumentTypeLabel,
  getFileStorageStatusLabel,
  getPaymentObligationStatusLabel,
  getPaymentObligationTypeLabel,
  getServiceWalletRoleScopeLabel
} from '../src/ui/domainLabels';

describe('domain labels', () => {
  it('maps document types and storage statuses to vietnamese labels', () => {
    expect(getDocumentTypeLabel('DON_DANG_KY')).toBe('Đơn đăng ký đất đai lần đầu');
    expect(getDocumentTypeLabel('UNKNOWN_CODE')).toBe('Giấy tờ bổ sung');
    expect(getFileStorageStatusLabel('UPLOADED_IPFS')).toBe('Đã tải lên IPFS');
    expect(getFileStorageStatusLabel('FAILED')).toBe('Lỗi tải tệp');
    expect(getFileStorageStatusLabel('UNKNOWN')).toBe('Trạng thái khác');
  });

  it('maps payment and blockchain statuses to user-friendly labels', () => {
    expect(getPaymentObligationTypeLabel('INTAKE_FEE')).toBe('Lệ phí tiếp nhận');
    expect(getPaymentObligationTypeLabel('LAND_FINANCIAL_OBLIGATION')).toBe('Nghĩa vụ tài chính đất đai');
    expect(getPaymentObligationStatusLabel('PENDING')).toBe('Chờ xác nhận');
    expect(getPaymentObligationStatusLabel('CONFIRMED')).toBe('Đã xác nhận');
    expect(getBlockchainResultStatusLabel('CONFIRMED')).toBe('Đã xác nhận');
    expect(getBlockchainResultStatusLabel('FAILED')).toBe('Thất bại');
  });

  it('maps service wallet role scope labels', () => {
    expect(getServiceWalletRoleScopeLabel('LAND_REGISTRY_OFFICER')).toBe('Cán bộ VPĐKĐĐ');
    expect(getServiceWalletRoleScopeLabel('APPROVAL_AUTHORITY')).toBe('Cơ quan phê duyệt');
    expect(getServiceWalletRoleScopeLabel('UNKNOWN')).toBe('Vai trò khác');
  });
});
