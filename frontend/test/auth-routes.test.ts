import { describe, expect, it } from 'vitest';
import { CITIZEN_ROLES, DASHBOARD_ROLES, OFFICER_ROLES, ROLE_LABELS } from '../src/auth/roles';

describe('auth route role mapping', () => {
  it('keeps citizen and officer roles separated for guarded navigation', () => {
    expect(CITIZEN_ROLES).toEqual(['CITIZEN', 'BUSINESS']);
    expect(DASHBOARD_ROLES).toEqual(['LAND_REGISTRY_OFFICER', 'ADMIN']);
    expect(OFFICER_ROLES).toContain('RECEPTION_OFFICER');
    expect(CITIZEN_ROLES).not.toContain('ADMIN');
  });

  it('has labels for all route guard roles', () => {
    [...CITIZEN_ROLES, ...OFFICER_ROLES].forEach((role) => {
      expect(ROLE_LABELS[role]).toBeTruthy();
    });
  });
});
