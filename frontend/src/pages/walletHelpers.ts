export type WalletNetwork = 'SEPOLIA' | 'HARDHAT' | 'GANACHE';
export type WalletStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'INACTIVE';

export const WALLET_NETWORK_OPTIONS: Array<{ value: WalletNetwork; label: string }> = [
  { value: 'SEPOLIA', label: 'Sepolia' },
  { value: 'HARDHAT', label: 'Hardhat Local' },
  { value: 'GANACHE', label: 'Ganache Local' }
];

export function normalizeWalletAddressInput(value: string) {
  return value.trim();
}

export function isLikelyEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function getWalletStatusLabel(status: WalletStatus | string) {
  switch (status) {
    case 'PENDING_VERIFICATION':
      return 'Chờ xác minh';
    case 'VERIFIED':
      return 'Đã xác minh';
    case 'INACTIVE':
      return 'Ngừng hoạt động';
    default:
      return status;
  }
}

export function getWalletStatusBadgeClass(status: WalletStatus | string) {
  switch (status) {
    case 'VERIFIED':
      return 'badge-success';
    case 'INACTIVE':
      return 'badge-danger';
    default:
      return 'badge-warning';
  }
}

export function shortenWalletAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
