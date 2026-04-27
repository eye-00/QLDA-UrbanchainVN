export type UserRole =
  | 'CITIZEN'
  | 'BUSINESS'
  | 'RECEPTION_OFFICER'
  | 'COMMUNE_OFFICER'
  | 'LAND_REGISTRY_OFFICER'
  | 'APPROVAL_AUTHORITY'
  | 'ADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  CITIZEN: 'Công dân',
  BUSINESS: 'Doanh nghiệp',
  RECEPTION_OFFICER: 'Cán bộ tiếp nhận',
  COMMUNE_OFFICER: 'Cán bộ cấp xã',
  LAND_REGISTRY_OFFICER: 'Cán bộ VPĐKĐĐ',
  APPROVAL_AUTHORITY: 'Cơ quan phê duyệt',
  ADMIN: 'Quản trị'
};

export const CITIZEN_ROLES: UserRole[] = ['CITIZEN', 'BUSINESS'];
export const OFFICER_ROLES: UserRole[] = [
  'RECEPTION_OFFICER',
  'COMMUNE_OFFICER',
  'LAND_REGISTRY_OFFICER',
  'APPROVAL_AUTHORITY',
  'ADMIN'
];
export const DASHBOARD_ROLES: UserRole[] = ['LAND_REGISTRY_OFFICER', 'ADMIN'];
