import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import { useToast } from '../ui/ToastContext';
import {
  getWalletStatusBadgeClass,
  getWalletStatusLabel,
  isLikelyEvmAddress,
  normalizeWalletAddressInput,
  shortenWalletAddress,
  WALLET_NETWORK_OPTIONS,
  WalletNetwork,
  WalletStatus
} from './walletHelpers';

type WalletItem = {
  id: string;
  address: string;
  addressShort?: string;
  network: WalletNetwork;
  status: WalletStatus;
  isDefault: boolean;
  verifiedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
};

type WalletListResponse = {
  items: WalletItem[];
  total: number;
};

type WalletChallengeResponse = {
  walletId: string;
  challengeId: string;
  message: string;
  nonce: string;
  expiresAt: string;
};

type WalletActionResponse = WalletItem;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function WalletManagementPage() {
  const { showToast } = useToast();
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<WalletNetwork>('SEPOLIA');
  const [activeChallenge, setActiveChallenge] = useState<WalletChallengeResponse | null>(null);

  const pendingWalletIds = useMemo(
    () => new Set(wallets.filter((item) => item.status === 'PENDING_VERIFICATION').map((item) => item.id)),
    [wallets]
  );

  async function loadWallets() {
    setLoading(true);
    try {
      const data = await apiGet<WalletListResponse>('/wallets/me');
      setWallets(data.items);
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tải được danh sách ví.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWallets();
  }, []);

  async function onConnectWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAddress = normalizeWalletAddressInput(address);
    if (!isLikelyEvmAddress(normalizedAddress)) {
      showToast('error', 'Địa chỉ ví không đúng định dạng EVM.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<WalletActionResponse>('/wallets/connect', {
        address: normalizedAddress,
        network
      });
      showToast('success', `Đã liên kết ví ${shortenWalletAddress(data.address)} (${getWalletStatusLabel(data.status)}).`);
      setAddress('');
      await loadWallets();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Liên kết ví thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function requestChallenge(walletId: string) {
    setLoading(true);
    try {
      const challenge = await apiPost<WalletChallengeResponse>(`/wallets/${walletId}/challenge`, {});
      setActiveChallenge(challenge);
      showToast('success', 'Đã tạo thông điệp xác minh. Hãy ký bằng đúng ví đã liên kết.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không tạo được challenge xác minh.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyWallet(wallet: WalletItem) {
    if (!activeChallenge || activeChallenge.walletId !== wallet.id) {
      showToast('error', 'Bạn cần tạo challenge xác minh trước khi ký.');
      return;
    }

    if (!window.ethereum) {
      showToast('error', 'Không tìm thấy ví trình duyệt. Hãy cài MetaMask hoặc ví EVM tương thích.');
      return;
    }

    setLoading(true);
    try {
      const accountsRaw = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = Array.isArray(accountsRaw) ? (accountsRaw as string[]) : [];
      const matchedAccount =
        accounts.find((item) => item.toLowerCase() === wallet.address.toLowerCase()) ?? accounts[0] ?? wallet.address;

      const signatureRaw = await window.ethereum.request({
        method: 'personal_sign',
        params: [activeChallenge.message, matchedAccount]
      });

      const signature = typeof signatureRaw === 'string' ? signatureRaw : '';
      if (!signature) {
        showToast('error', 'Không nhận được chữ ký từ ví.');
        return;
      }

      const verified = await apiPost<WalletActionResponse>(`/wallets/${wallet.id}/verify`, { signature });
      showToast('success', `Xác minh ví thành công: ${shortenWalletAddress(verified.address)}.`);
      setActiveChallenge(null);
      await loadWallets();
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? `${error.message}. Nếu challenge hết hạn, hãy tạo challenge mới và ký lại.`
          : 'Xác minh ví thất bại.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function setDefaultWallet(walletId: string) {
    setLoading(true);
    try {
      await apiPatch<WalletActionResponse>(`/wallets/${walletId}/default`, {});
      showToast('success', 'Đã cập nhật ví mặc định.');
      await loadWallets();
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Không cập nhật được ví mặc định.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="row-gap">
      <div className="section-header">
        <div>
          <h2>Quản lý ví blockchain</h2>
          <p className="section-subtitle">Liên kết và xác minh ví EVM để dùng cho các thao tác blockchain.</p>
        </div>
      </div>

      <form className="card form-grid form-grid-fluid" onSubmit={onConnectWallet}>
        <label className="field-span-2">
          Địa chỉ ví EVM
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="0x..."
            autoComplete="off"
            required
          />
        </label>
        <label>
          Mạng blockchain
          <select value={network} onChange={(event) => setNetwork(event.target.value as WalletNetwork)}>
            {WALLET_NETWORK_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="action-row">
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Kết nối ví'}
          </button>
        </div>
      </form>

      {activeChallenge ? (
        <div className="notice">
          <strong>Challenge xác minh đang chờ ký</strong>
          <div className="muted">Ví: {shortenWalletAddress(wallets.find((item) => item.id === activeChallenge.walletId)?.address ?? '')}</div>
          <div className="muted">Hết hạn: {new Date(activeChallenge.expiresAt).toLocaleString('vi-VN')}</div>
        </div>
      ) : null}

      {wallets.length === 0 ? (
        <div className="empty-state">Bạn chưa liên kết ví blockchain nào.</div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Địa chỉ ví</th>
                  <th>Mạng</th>
                  <th>Trạng thái</th>
                  <th>Xác minh gần nhất</th>
                  <th>Mặc định</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => {
                  const canRequestChallenge = wallet.status === 'PENDING_VERIFICATION';
                  const canVerify =
                    wallet.status === 'PENDING_VERIFICATION' &&
                    activeChallenge?.walletId === wallet.id &&
                    pendingWalletIds.has(wallet.id);
                  const canSetDefault = wallet.status === 'VERIFIED' && !wallet.isDefault;
                  return (
                    <tr key={wallet.id}>
                      <td>
                        <div>{wallet.addressShort ?? shortenWalletAddress(wallet.address)}</div>
                        <div className="muted">{wallet.address}</div>
                      </td>
                      <td>{wallet.network}</td>
                      <td>
                        <span className={`badge ${getWalletStatusBadgeClass(wallet.status)}`}>
                          {getWalletStatusLabel(wallet.status)}
                        </span>
                      </td>
                      <td>{wallet.lastVerifiedAt ? new Date(wallet.lastVerifiedAt).toLocaleString('vi-VN') : 'Chưa xác minh'}</td>
                      <td>{wallet.isDefault ? 'Mặc định' : '—'}</td>
                      <td>
                        <div className="action-row">
                          {canRequestChallenge ? (
                            <button type="button" className="btn btn-outline" onClick={() => void requestChallenge(wallet.id)} disabled={loading}>
                              Nhận challenge
                            </button>
                          ) : null}
                          {canVerify ? (
                            <button type="button" onClick={() => void verifyWallet(wallet)} disabled={loading}>
                              Ký xác minh
                            </button>
                          ) : null}
                          {canSetDefault ? (
                            <button type="button" className="btn btn-outline" onClick={() => void setDefaultWallet(wallet.id)} disabled={loading}>
                              Đặt mặc định
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
