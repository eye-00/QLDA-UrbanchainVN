import { WalletAccount } from "@prisma/client";

function getWalletAddressPreview(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function toWalletItem(wallet: WalletAccount) {
  return {
    id: wallet.id,
    address: wallet.address,
    addressShort: getWalletAddressPreview(wallet.address),
    network: wallet.network,
    status: wallet.status,
    isDefault: wallet.isDefault,
    verifiedAt: wallet.verifiedAt,
    lastVerifiedAt: wallet.lastVerifiedAt,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt
  };
}
