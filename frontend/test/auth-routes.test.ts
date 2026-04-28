import { describe, expect, it } from 'vitest';
import {
  ADMIN_ONLY_ROLES,
  ALL_AUTH_ROLES,
  CITIZEN_ROLES,
  DASHBOARD_ROLES,
  LAND_MANAGEMENT_ROLES,
  ROLE_LABELS
} from '../src/auth/roles';

describe('auth route role mapping', () => {
  it('keeps route guards aligned with Sprint 2 RBAC', () => {
    expect(CITIZEN_ROLES).toEqual(['CITIZEN', 'BUSINESS']);
    expect(DASHBOARD_ROLES).toEqual(ALL_AUTH_ROLES);
    expect(ADMIN_ONLY_ROLES).toEqual(['ADMIN']);
    expect(LAND_MANAGEMENT_ROLES).toContain('RECEPTION_OFFICER');
    expect(LAND_MANAGEMENT_ROLES).toContain('ADMIN');
    expect(LAND_MANAGEMENT_ROLES).not.toContain('CITIZEN');
  });

  it('has labels for all route guard roles', () => {
    ALL_AUTH_ROLES.forEach((role) => {
      expect(ROLE_LABELS[role]).toBeTruthy();
    });
  });
});
