import { apiGet, apiPostFormData } from './api';

export type UploadedFileItem = {
  id: string;
  originalName: string;
  documentType: string;
  storageStatus: string;
  cid: string | null;
  hash: string | null;
};

export type FileIntegrityResult = {
  fileId: string;
  cid: string | null;
  hash: string | null;
  storageStatus: string;
  checks: {
    hasCid: boolean;
    hasHash: boolean;
    storageStatusValid: boolean;
  };
  isValid: boolean;
};

export type FileDownloadResult = {
  fileId: string;
  cid: string | null;
  downloadUrl: string | null;
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'DON_DANG_KY', label: 'Đơn đăng ký đất đai lần đầu' },
  { value: 'GIAY_TO_NHAN_THAN', label: 'Giấy tờ nhân thân' },
  { value: 'GIAY_TO_QUYEN_SU_DUNG_DAT', label: 'Giấy tờ về quyền sử dụng đất' },
  { value: 'TRICH_DO_BAN_DO', label: 'Trích đo / bản đồ / trích lục' },
  { value: 'MINH_CHUNG_KHAC', label: 'Minh chứng bổ sung khác' }
] as const;

export async function uploadRegistrationFile(file: File, documentType: string) {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('documentType', documentType);
  formData.set('ownerType', 'USER');
  formData.set('originalName', file.name);
  return apiPostFormData<UploadedFileItem>('/files/upload', formData);
}

export function getFileMetadata(fileId: string) {
  return apiGet<UploadedFileItem>(`/files/${fileId}`);
}

export function getFileDownload(fileId: string) {
  return apiGet<FileDownloadResult>(`/files/${fileId}/download`);
}

export function getFileIntegrity(fileId: string) {
  return apiGet<FileIntegrityResult>(`/files/${fileId}/integrity`);
}

export function shortValue(value: string | null, start = 8, end = 6) {
  if (!value) return 'Chưa có';
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

