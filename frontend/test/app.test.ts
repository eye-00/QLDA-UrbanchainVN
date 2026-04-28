import { describe, expect, it } from 'vitest';
import { ALL_AUTH_ROLES, DASHBOARD_ROLES, LAND_MANAGEMENT_ROLES } from '../src/auth/roles';

describe('Sprint 2 navigation access model', () => {
  it('supports role-based dashboard for all authenticated roles', () => {
    expect(DASHBOARD_ROLES).toEqual(ALL_AUTH_ROLES);
    expect(DASHBOARD_ROLES).toContain('CITIZEN');
    expect(DASHBOARD_ROLES).toContain('ADMIN');
  });

  it('keeps land management for officer/admin roles', () => {
    expect(LAND_MANAGEMENT_ROLES).not.toContain('CITIZEN');
    expect(LAND_MANAGEMENT_ROLES).toContain('RECEPTION_OFFICER');
    expect(LAND_MANAGEMENT_ROLES).toContain('ADMIN');
  });
});
