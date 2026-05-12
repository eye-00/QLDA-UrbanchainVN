import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useToast } from '../ui/ToastContext';

type ServiceWalletItem = {
  id: string;
  walletId: string;
  walletAddress: string;
  network: 'SEPOLIA' | 'HARDHAT' | 'GANACHE';
  chainId: number;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  roleScope: 'LAND_REGISTRY_OFFICER' | 'APPROVAL_AUTHORITY' | 'ADMIN';
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    organizationId: string | null;
  };
  organizationId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
  revokedAt: string | null;
};

type ServiceWalletListResponse = {
  items: ServiceWalletItem[];
  total: number;
};

type WalletListResponse = {
  items: Array<{
    id: string;
    address: string;
    addressShort?: string;
    network: 'SEPOLIA' | 'HARDHAT' | 'GANACHE';
    status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'INACTIVE';
  }>;
  total: number;
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';

const ROLE_SCOPE_OPTIONS: Array<{ value: ServiceWalletItem['roleScope']; label: string }> = [
  { value: 'LAND_REGISTRY_OFFICER', label: 'Cán bộ VPĐKĐĐ' },
  { value: 'APPROVAL_AUTHORITY', label: 'Cơ quan phê duyệt' },
  { value: 'ADMIN', label: 'Quản trị hệ thống' }
];

export function ServiceWalletManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ServiceWalletItem[]>([]);
  const [wallets, setWallets] = useState<WalletListResponse['items']>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [form, setForm] = useState({
    walletId: '',
    roleScope: 'LAND_REGISTRY_OFFICER' as ServiceWalletItem['roleScope'],
    chainId: Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID ?? 11155111),
    reason: ''
  });

  async function loadAuthorizations() {
    setLoading(true);
    try {
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const data = await apiGet<ServiceWalletListResponse>(`/service-wallets${query}`);
      setItems(data.items);
      if (!form.walletId && data.items.length > 0) {
        setForm((current) => ({ ...current, walletId: data.items[0].walletId }));
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách ví công vụ.');
    } finally {
      setLoading(false);
    }
  }

  async function loadWalletCatalog() {
    try {
      const data = await apiGet<WalletListResponse>('/wallets/me');
      const verified = data.items.filter((item) => item.status === 'VERIFIED');
      setWallets(verified);
      if (!form.walletId && verified.length > 0) {
        setForm((current) => ({ ...current, walletId: verified[0].id }));
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh mục ví đã xác minh.');
    }
  }

  useEffect(() => {
    void Promise.all([loadAuthorizations(), loadWalletCatalog()]);
  }, []);

  useEffect(() => {
    void loadAuthorizations();
  }, [statusFilter]);

  async function onCreateAuthorization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.walletId) {
      showToast('error', 'Vui lòng chọn ví trước khi cấp quyền.');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/service-wallets', {
        walletId: form.walletId,
        roleScope: form.roleScope,
        chainId: form.chainId,
        reason: form.reason.trim() || undefined
      });
      showToast('success', 'Đã cấp quyền ví công vụ.');
      setForm((current) => ({ ...current, reason: '' }));
      await loadAuthorizations();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cấp được quyền ví công vụ.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(item: ServiceWalletItem, status: 'ACTIVE' | 'REVOKED' | 'EXPIRED') {
    setLoading(true);
    try {
      await apiPatch(`/service-wallets/${item.id}/status`, {
        status,
        reason: status === 'REVOKED' ? 'Thu hồi theo cập nhật phân quyền' : 'Cập nhật trạng thái vận hành'
      });
      showToast('success', 'Đã cập nhật trạng thái ví công vụ.');
      await loadAuthorizations();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được trạng thái.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Quản trị ví công vụ</h2>
          <p className="section-subtitle">Cấp quyền, thu hồi và theo dõi hiệu lực ví dùng cho thao tác ghi blockchain.</p>
        </div>
        <button type="button" onClick={() => void loadAuthorizations()} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <form className="card form-grid-4" onSubmit={onCreateAuthorization}>
        <label>
          Ví đã xác minh
          <select value={form.walletId} onChange={(event) => setForm({ ...form, walletId: event.target.value })}>
            <option value="">Chọn ví</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.addressShort ?? wallet.address} ({wallet.network})
              </option>
            ))}
          </select>
        </label>
        <label>
          Vai trò nghiệp vụ
          <select
            value={form.roleScope}
            onChange={(event) => setForm({ ...form, roleScope: event.target.value as ServiceWalletItem['roleScope'] })}
          >
            {ROLE_SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chain ID
          <input
            value={form.chainId}
            onChange={(event) => setForm({ ...form, chainId: Number(event.target.value) || 0 })}
            type="number"
            min={1}
          />
        </label>
        <label>
          Lý do cấp quyền
          <input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Mô tả ngắn" />
        </label>
        <div className="action-row">
          <button type="submit" disabled={loading}>
            Cấp quyền ví công vụ
          </button>
        </div>
      </form>

      <div className="card form-grid-4">
        <label>
          Trạng thái
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="REVOKED">Đã thu hồi</option>
            <option value="EXPIRED">Hết hiệu lực</option>
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Chưa có ví công vụ nào.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ví</th>
                  <th>Role scope</th>
                  <th>Network / Chain</th>
                  <th>Người sở hữu</th>
                  <th>Trạng thái</th>
                  <th>Hiệu lực</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="mono-text">{item.walletAddress}</td>
                    <td>{item.roleScope}</td>
                    <td>{item.network} / {item.chainId}</td>
                    <td>
                      <div>{item.user.fullName}</div>
                      <div className="muted">{item.user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'ACTIVE' ? 'badge-success' : item.status === 'REVOKED' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div>{new Date(item.effectiveFrom).toLocaleString('vi-VN')}</div>
                      <div className="muted">{item.effectiveTo ? `Đến ${new Date(item.effectiveTo).toLocaleString('vi-VN')}` : 'Không thời hạn'}</div>
                    </td>
                    <td>
                      <div className="action-row">
                        {item.status !== 'ACTIVE' && (
                          <button type="button" className="btn btn-outline" onClick={() => void updateStatus(item, 'ACTIVE')} disabled={loading}>
                            Kích hoạt
                          </button>
                        )}
                        {item.status === 'ACTIVE' && (
                          <button type="button" className="btn btn-outline" onClick={() => void updateStatus(item, 'REVOKED')} disabled={loading}>
                            Thu hồi
                          </button>
                        )}
                        {item.status === 'ACTIVE' && (
                          <button type="button" className="btn btn-outline" onClick={() => void updateStatus(item, 'EXPIRED')} disabled={loading}>
                            Hết hiệu lực
                          </button>
                        )}
                      </div>
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
