-- Sprint 4 legal-aligned: service wallet governance + blockchain tx lifecycle

CREATE TABLE `ServiceWalletAuthorization` (
  `id` VARCHAR(191) NOT NULL,
  `walletId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NULL,
  `roleScope` ENUM(
    'CITIZEN',
    'BUSINESS',
    'RECEPTION_OFFICER',
    'COMMUNE_OFFICER',
    'LAND_REGISTRY_OFFICER',
    'APPROVAL_AUTHORITY',
    'TAX_OFFICER',
    'AUDITOR',
    'ADMIN'
  ) NOT NULL,
  `network` ENUM('SEPOLIA', 'HARDHAT', 'GANACHE') NOT NULL,
  `chainId` INTEGER NOT NULL,
  `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `effectiveTo` DATETIME(3) NULL,
  `reason` VARCHAR(191) NULL,
  `revokedAt` DATETIME(3) NULL,
  `revokedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `svc_wallet_network_chain_status_idx` (`network`, `chainId`, `status`),
  INDEX `svc_wallet_user_role_status_idx` (`userId`, `roleScope`, `status`),
  INDEX `svc_wallet_walletId_idx` (`walletId`),
  CONSTRAINT `ServiceWalletAuthorization_walletId_fkey`
    FOREIGN KEY (`walletId`) REFERENCES `WalletAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceWalletAuthorization_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ServiceWalletAuthorization_revokedById_fkey`
    FOREIGN KEY (`revokedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BlockchainTxLifecycle` (
  `id` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `network` ENUM('SEPOLIA', 'HARDHAT', 'GANACHE') NOT NULL,
  `chainId` INTEGER NOT NULL,
  `walletAddress` VARCHAR(191) NOT NULL,
  `txHash` VARCHAR(191) NULL,
  `explorerUrl` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `errorCode` VARCHAR(191) NULL,
  `errorMessage` VARCHAR(191) NULL,
  `payload` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `blockchain_tx_registration_createdAt_idx` (`registrationId`, `createdAt`),
  INDEX `blockchain_tx_status_network_chain_idx` (`status`, `network`, `chainId`),
  CONSTRAINT `BlockchainTxLifecycle_registrationId_fkey`
    FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BlockchainTxLifecycle_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
