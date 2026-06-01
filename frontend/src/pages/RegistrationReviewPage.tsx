import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import { getRegistrationStatusBadgeClass, getRegistrationStatusLabel } from '../ui/registrationStatus';
import {
  buildRegistrationReviewQuery
} from './registrationReviewHelpers';
import { formatShortTxHash } from './registrationBlockchainHelpers';

type RegistrationItem = {
  id: string;
  code: string;
  applicantId: string;
  status: string;
  tokenId?: number | null;
  txHash?: string | null;
  landCode?: string | null;
  procedureCode?: string | null;
  legalBasisCode?: string | null;
  landInfo: {
    provinceCode: string;
    communeName: string;
    parcelNumber: string;
    mapSheetNumber: string;
    area: number;
    landUsePurpose: string;
    address: string;
  };
  ownerInfo: {
    ownerType: string;
    fullName: string;
    identityNumber: string | null;
    address: string | null;
  };
  notes: string[];
  files?: Array<{
    id: string;
    documentType: string;
    originalName: string;
    cid: string | null;
    hash: string | null;
  }>;
  updatedAt: string;
};

type RegistrationListResponse = {
  items: RegistrationItem[];
  total: number;
};

const STATUS_FILTER_OPTIONS = [
  'CHO_TIEP_NHAN',
  'CAN_BO_SUNG',
  'DA_TIEP_NHAN',
  'CHO_XAC_NHAN_CAP_XA',
  'DA_XAC_NHAN_CAP_XA',
  'DANG_THAM_DINH_VPDKDD',
  'CHO_THUE',
  'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH',
  'CHO_KY_CAP',
  'DA_KY_CAP',
  'DA_CAP_NHAT_HO_SO_DIA_CHINH',
  'DA_GHI_BLOCKCHAIN',
  'DA_CAP',
  'DA_TRA_KET_QUA',
  'TU_CHOI'
];

const initialFilters = {
  keyword: '',
  status: ''
};

export function RegistrationReviewPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const queryString = useMemo(() => buildRegistrationReviewQuery(filters), [filters]);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const path = queryString ? `/registrations?${queryString}` : '/registrations?pageSize=50';
      const data = await apiGet<RegistrationListResponse>(path);
      setItems(data.items);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [queryString, showToast]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  return (
    <section className="toolbar-row">
      <div className="section-header">
        <div>
          <h2>Danh sách hồ sơ chờ xử lý</h2>
          <p className="section-subtitle">
            Lọc, mở chi tiết và cập nhật trạng thái hồ sơ đăng ký lần đầu theo vai trò xử lý.
          </p>
        </div>
        <button type="button" onClick={() => void loadRegistrations()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="card form-grid-4">
        <label>
          Từ khóa
          <input
            value={filters.keyword}
            placeholder="Mã hồ sơ, chủ sử dụng, số thửa..."
            onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
          />
        </label>
        <label>
          Trạng thái
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">Tất cả trạng thái</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getRegistrationStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <div className="action-row">
          <button type="button" onClick={() => void loadRegistrations()} disabled={loading}>
            Áp dụng bộ lọc
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setFilters(initialFilters)} disabled={loading}>
            Xóa lọc
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Không có hồ sơ phù hợp điều kiện lọc hiện tại.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã hồ sơ</th>
                  <th>Chủ sử dụng</th>
                  <th>Vị trí thửa đất</th>
                  <th>Trạng thái</th>
                  <th>Blockchain</th>
                  <th>Cập nhật</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.ownerInfo.fullName}</td>
                    <td>{item.landInfo.provinceCode} / {item.landInfo.communeName}</td>
                    <td>
                      <span className={`badge ${getRegistrationStatusBadgeClass(item.status)}`}>
                        {getRegistrationStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      {item.txHash ? (
                        <div className="row-gap-xs">
                          <div className="mono-text">{formatShortTxHash(item.txHash)}</div>
                          <div className="muted">Token #{item.tokenId ?? 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="muted">Chưa ghi chain</span>
                      )}
                    </td>
                    <td>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate(`/staff/registrations/review/${item.id}`)}
                      >
                        Mở hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
