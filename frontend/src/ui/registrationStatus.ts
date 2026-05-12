export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  MOI_TAO: 'Mới tạo',
  CHO_TIEP_NHAN: 'Chờ tiếp nhận',
  CAN_BO_SUNG: 'Cần bổ sung',
  DA_TIEP_NHAN: 'Đã tiếp nhận',
  CHO_XAC_NHAN_CAP_XA: 'Chờ xác nhận cấp xã',
  DA_XAC_NHAN_CAP_XA: 'Đã xác nhận cấp xã',
  DANG_THAM_DINH_VPDKDD: 'Đang thẩm định VPĐKĐĐ',
  CHO_THUE: 'Chờ xử lý thuế',
  CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH: 'Chờ hoàn thành nghĩa vụ tài chính',
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: 'Đã hoàn thành nghĩa vụ tài chính',
  CHO_KY_CAP: 'Chờ ký cấp',
  DA_KY_CAP: 'Đã ký cấp',
  DA_CAP_NHAT_HO_SO_DIA_CHINH: 'Đã cập nhật hồ sơ địa chính',
  DA_GHI_BLOCKCHAIN: 'Đã ghi blockchain',
  DA_CAP: 'Đã cấp',
  DA_HOAN_THANH_NGHIA_VU_TAI_CHINH: 'Đã hoàn thành nghĩa vụ tài chính',
  DA_CAP_NHAT_HO_SO_DIA_CHINH: 'Đã cập nhật hồ sơ địa chính',
  DA_GHI_BLOCKCHAIN: 'Đã ghi blockchain',
  DA_TRA_KET_QUA: 'Đã trả kết quả',
  HUY_HO_SO: 'Hủy hồ sơ',
  TU_CHOI: 'Từ chối'
};

export function getRegistrationStatusLabel(status: string) {
  return REGISTRATION_STATUS_LABELS[status] ?? status;
}

export function getRegistrationStatusBadgeClass(status: string) {
  if (status === 'DA_CAP' || status === 'DA_TRA_KET_QUA' || status === 'DA_XAC_NHAN_CAP_XA' || status === 'DA_GHI_BLOCKCHAIN' || status === 'DA_CAP_NHAT_HO_SO_DIA_CHINH') return 'badge-success';
  if (status === 'CAN_BO_SUNG' || status === 'TU_CHOI' || status === 'HUY_HO_SO') return 'badge-danger';
  if (status === 'CHO_TIEP_NHAN' || status === 'CHO_THUE' || status === 'CHO_KY_CAP' || status === 'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH') return 'badge-warning';
  return '';
}
