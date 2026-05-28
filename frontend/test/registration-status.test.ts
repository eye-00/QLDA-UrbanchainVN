import { describe, expect, it } from 'vitest';
import {
  getRegistrationStatusBadgeClass,
  getRegistrationStatusLabel
} from '../src/ui/registrationStatus';

describe('registration status helpers', () => {
  it('maps status code to Vietnamese labels', () => {
    expect(getRegistrationStatusLabel('CHO_TIEP_NHAN')).toBe('Chờ tiếp nhận');
    expect(getRegistrationStatusLabel('DA_CAP')).toBe('Đã cấp');
    expect(getRegistrationStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
  });

  it('returns proper badge classes by status type', () => {
    expect(getRegistrationStatusBadgeClass('DA_CAP')).toBe('badge-success');
    expect(getRegistrationStatusBadgeClass('CAN_BO_SUNG')).toBe('badge-danger');
    expect(getRegistrationStatusBadgeClass('CHO_TIEP_NHAN')).toBe('badge-warning');
    expect(getRegistrationStatusBadgeClass('DANG_THAM_DINH_VPDKDD')).toBe('');
  });
});
