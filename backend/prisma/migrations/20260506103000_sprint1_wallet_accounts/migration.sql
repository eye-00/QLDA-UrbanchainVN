-- Sprint 1 wallet integration: user wallet linking + EIP-191 verification.

CREATE TABLE `WalletAccount` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `network` ENUM('SEPOLIA', 'HARDHAT', 'GANACHE') NOT NULL,
    `status` ENUM('PENDING_VERIFICATION', 'VERIFIED', 'INACTIVE') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallet_network_address_unique`(`network`, `address`),
    INDEX `WalletAccount_userId_network_isDefault_idx`(`userId`, `network`, `isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WalletVerificationChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `nonce` VARCHAR(191) NOT NULL,
    `message` VARCHAR(1024) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WalletVerificationChallenge_walletId_usedAt_expiresAt_idx`(`walletId`, `usedAt`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `WalletAccount`
    ADD CONSTRAINT `WalletAccount_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `WalletVerificationChallenge`
    ADD CONSTRAINT `WalletVerificationChallenge_walletId_fkey`
    FOREIGN KEY (`walletId`) REFERENCES `WalletAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
