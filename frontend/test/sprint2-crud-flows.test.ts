import { describe, expect, it } from 'vitest';
import {
  buildLandPayload,
  buildLandQueryString,
  buildOrganizationCreatePayload,
  buildOrganizationUpdatePayload,
  buildUserCreatePayload,
  buildUserQueryString,
  buildUserUpdatePayload,
  getNextUserStatus
} from '../src/pages/sprint2PageHelpers';

describe('Sprint 2 CRUD helper flows', () => {
  it('builds user create/update payload and status transitions', () => {
    expect(
      buildUserCreatePayload({
        fullName: ' Nguyen Van A ',
        email: ' citizen@urbanchain.vn ',
        password: 'StrongPassword@123',
        role: 'CITIZEN',
        organizationId: ''
      })
    ).toEqual({
      fullName: 'Nguyen Van A',
      email: 'citizen@urbanchain.vn',
      password: 'StrongPassword@123',
      role: 'CITIZEN',
      organizationId: null
    });

    expect(
      buildUserUpdatePayload({
        fullName: ' Can bo tiep nhan ',
        email: ' officer@urbanchain.vn ',
        role: 'RECEPTION_OFFICER',
        organizationId: 'org-001'
      })
    ).toEqual({
      fullName: 'Can bo tiep nhan',
      email: 'officer@urbanchain.vn',
      role: 'RECEPTION_OFFICER',
      organizationId: 'org-001'
    });

    expect(
      buildUserUpdatePayload({
        fullName: ' Can bo tiep nhan ',
        email: ' officer@urbanchain.vn ',
        role: 'RECEPTION_OFFICER',
        organizationId: ''
      })
    ).toEqual({
      fullName: 'Can bo tiep nhan',
      email: 'officer@urbanchain.vn',
      role: 'RECEPTION_OFFICER',
      organizationId: null
    });

    expect(getNextUserStatus('ACTIVE')).toBe('LOCKED');
    expect(getNextUserStatus('LOCKED')).toBe('ACTIVE');
  });

  it('builds organization payloads and land payload/query', () => {
    expect(
      buildOrganizationCreatePayload({
        code: ' ORG-LAND ',
        name: ' Chi nhanh VPDKDD ',
        description: ' '
      })
    ).toEqual({
      code: 'ORG-LAND',
      name: 'Chi nhanh VPDKDD',
      description: undefined
    });

    expect(
      buildOrganizationUpdatePayload({
        code: ' ORG-LAND ',
        name: ' Chi nhanh VPDKDD Da Nang ',
        description: ' Mo rong dia ban ',
        isActive: true
      })
    ).toEqual({
      code: 'ORG-LAND',
      name: 'Chi nhanh VPDKDD Da Nang',
      description: 'Mo rong dia ban',
      isActive: true
    });

    expect(
      buildLandPayload({
        parcelCode: ' LAND-001 ',
        provinceCode: ' 48 ',
        communeName: ' Hoa Khanh ',
        mapSheetNumber: ' 05 ',
        parcelNumber: ' 123 ',
        area: '120.5',
        landUsePurpose: ' ODT ',
        address: ' 54 Nguyen Luong Bang ',
        ownerUserId: ''
      })
    ).toEqual({
      parcelCode: 'LAND-001',
      provinceCode: '48',
      communeName: 'Hoa Khanh',
      mapSheetNumber: '05',
      parcelNumber: '123',
      area: 120.5,
      landUsePurpose: 'ODT',
      address: '54 Nguyen Luong Bang',
      ownerUserId: null
    });

    expect(
      buildUserQueryString({
        keyword: ' admin ',
        role: 'ADMIN',
        organizationId: 'org-approval',
        status: 'ACTIVE'
      })
    ).toBe('keyword=admin&role=ADMIN&organizationId=org-approval&status=ACTIVE');

    expect(
      buildLandQueryString({
        keyword: ' LAND-001 ',
        provinceCode: '48',
        communeName: ''
      })
    ).toBe('keyword=LAND-001&provinceCode=48');
  });
});
