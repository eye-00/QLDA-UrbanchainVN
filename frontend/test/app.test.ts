import { describe, expect, it } from 'vitest';
import { CITIZEN_ROLES, DASHBOARD_ROLES, OFFICER_ROLES } from '../src/auth/roles';

describe('Sprint 1 navigation access model', () => {
  it('keeps dashboard access limited to admin and land registry officer roles', () => {
    expect(DASHBOARD_ROLES).toEqual(['LAND_REGISTRY_OFFICER', 'ADMIN']);
    expect(DASHBOARD_ROLES).not.toContain('CITIZEN');
    expect(DASHBOARD_ROLES).not.toContain('RECEPTION_OFFICER');
  });

  it('allows land lookup to authenticated citizens and officers', () => {
    const lookupRoles = [...CITIZEN_ROLES, ...OFFICER_ROLES];

    expect(lookupRoles).toContain('CITIZEN');
    expect(lookupRoles).toContain('RECEPTION_OFFICER');
    expect(lookupRoles).toContain('ADMIN');
  });
});
