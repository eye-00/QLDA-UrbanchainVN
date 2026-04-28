import { UserRole } from '../auth/roles';

export type UserFilters = {
  keyword: string;
  role: string;
  organizationId: string;
  status: string;
};

export type UserForm = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId: string;
};

export type UserEditForm = {
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string;
};

export type OrganizationForm = {
  code: string;
  name: string;
  description: string;
};

export type OrganizationEditForm = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type LandForm = {
  parcelCode: string;
  provinceCode: string;
  communeName: string;
  mapSheetNumber: string;
  parcelNumber: string;
  area: string;
  landUsePurpose: string;
  address: string;
  ownerUserId: string;
};

export type LandFilters = {
  keyword: string;
  provinceCode: string;
  communeName: string;
};

function trimOrEmpty(value: string) {
  return value.trim();
}

export function buildUserQueryString(filters: UserFilters) {
  const query = new URLSearchParams();
  const keyword = trimOrEmpty(filters.keyword);
  if (keyword) query.set('keyword', keyword);
  if (filters.role) query.set('role', filters.role);
  if (filters.organizationId) query.set('organizationId', filters.organizationId);
  if (filters.status) query.set('status', filters.status);
  return query.toString();
}

export function buildUserCreatePayload(form: UserForm) {
  return {
    fullName: trimOrEmpty(form.fullName),
    email: trimOrEmpty(form.email),
    password: form.password,
    role: form.role,
    organizationId: form.organizationId || null
  };
}

export function buildUserUpdatePayload(form: UserEditForm) {
  return {
    fullName: trimOrEmpty(form.fullName),
    email: trimOrEmpty(form.email),
    role: form.role,
    organizationId: form.organizationId || null
  };
}

export function getNextUserStatus(status: 'ACTIVE' | 'LOCKED') {
  return status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
}

export function buildOrganizationCreatePayload(form: OrganizationForm) {
  return {
    code: trimOrEmpty(form.code),
    name: trimOrEmpty(form.name),
    description: trimOrEmpty(form.description) || undefined
  };
}

export function buildOrganizationUpdatePayload(form: OrganizationEditForm) {
  return {
    code: trimOrEmpty(form.code),
    name: trimOrEmpty(form.name),
    description: trimOrEmpty(form.description) || null,
    isActive: form.isActive
  };
}

export function buildLandQueryString(filters: LandFilters) {
  const query = new URLSearchParams();
  const keyword = trimOrEmpty(filters.keyword);
  const provinceCode = trimOrEmpty(filters.provinceCode);
  const communeName = trimOrEmpty(filters.communeName);
  if (keyword) query.set('keyword', keyword);
  if (provinceCode) query.set('provinceCode', provinceCode);
  if (communeName) query.set('communeName', communeName);
  return query.toString();
}

export function buildLandPayload(form: LandForm) {
  return {
    parcelCode: trimOrEmpty(form.parcelCode),
    provinceCode: trimOrEmpty(form.provinceCode),
    communeName: trimOrEmpty(form.communeName),
    mapSheetNumber: trimOrEmpty(form.mapSheetNumber),
    parcelNumber: trimOrEmpty(form.parcelNumber),
    area: Number(form.area),
    landUsePurpose: trimOrEmpty(form.landUsePurpose),
    address: trimOrEmpty(form.address),
    ownerUserId: form.ownerUserId || null
  };
}
