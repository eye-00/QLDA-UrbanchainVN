export type UserRole =
  | 'CITIZEN'
  | 'BUSINESS'
  | 'RECEPTION_OFFICER'
  | 'COMMUNE_OFFICER'
  | 'LAND_REGISTRY_OFFICER'
  | 'APPROVAL_AUTHORITY'
  | 'TAX_OFFICER'
  | 'AUDITOR'
  | 'ADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  CITIZEN: 'Công dân',
  BUSINESS: 'Doanh nghiệp',
  RECEPTION_OFFICER: 'Cán bộ tiếp nhận',
  COMMUNE_OFFICER: 'Cán bộ cấp xã',
  LAND_REGISTRY_OFFICER: 'Cán bộ VPĐKĐĐ',
  APPROVAL_AUTHORITY: 'Cơ quan phê duyệt',
  TAX_OFFICER: 'Cán bộ thuế',
  AUDITOR: 'Kiểm toán',
  ADMIN: 'Quản trị'
};

export const CITIZEN_ROLES: UserRole[] = ['CITIZEN', 'BUSINESS'];
export const OFFICER_ROLES: UserRole[] = [
  'RECEPTION_OFFICER',
  'COMMUNE_OFFICER',
  'LAND_REGISTRY_OFFICER',
  'APPROVAL_AUTHORITY',
  'TAX_OFFICER',
  'AUDITOR',
  'ADMIN'
];
export const ALL_AUTH_ROLES: UserRole[] = [...CITIZEN_ROLES, ...OFFICER_ROLES];
export const DASHBOARD_ROLES: UserRole[] = ALL_AUTH_ROLES;
export const ADMIN_ONLY_ROLES: UserRole[] = ['ADMIN'];
export const LAND_MANAGEMENT_ROLES: UserRole[] = OFFICER_ROLES;
export const REGISTRATION_REVIEW_ROLES: UserRole[] = OFFICER_ROLES;
