-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('CITIZEN', 'BUSINESS', 'RECEPTION_OFFICER', 'COMMUNE_OFFICER', 'LAND_REGISTRY_OFFICER', 'APPROVAL_AUTHORITY', 'ADMIN') NOT NULL,
    `identityNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Registration` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `applicantId` VARCHAR(191) NOT NULL,
    `landCode` VARCHAR(191) NULL,
    `parcelNumber` VARCHAR(191) NOT NULL,
    `mapSheetNumber` VARCHAR(191) NOT NULL,
    `area` DECIMAL(10, 2) NOT NULL,
    `landUsePurpose` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `status` ENUM('MOI_TAO', 'CHO_TIEP_NHAN', 'CAN_BO_SUNG', 'DA_TIEP_NHAN', 'CHO_XAC_NHAN_CAP_XA', 'DA_XAC_NHAN_CAP_XA', 'DANG_THAM_DINH_VPDKDD', 'CHO_THUE', 'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH', 'CHO_KY_CAP', 'DA_KY_CAP', 'DA_CAP', 'DA_TRA_KET_QUA', 'TU_CHOI') NOT NULL DEFAULT 'MOI_TAO',
    `ipfsCid` VARCHAR(191) NULL,
    `documentHash` VARCHAR(191) NULL,
    `tokenId` INTEGER NULL,
    `txHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Registration_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransferRequest` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `landCode` VARCHAR(191) NOT NULL,
    `fromUserId` VARCHAR(191) NULL,
    `toUserRef` VARCHAR(191) NOT NULL,
    `status` ENUM('MOI_TAO_BIEN_DONG', 'CHO_TIEP_NHAN', 'CAN_BO_SUNG', 'DA_TIEP_NHAN', 'DANG_KIEM_TRA_DIEU_KIEN', 'DA_CHUYEN_THUE', 'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH', 'DANG_CAP_NHAT_BIEN_DONG', 'DA_DANG_KY_BIEN_DONG', 'DA_TRA_KET_QUA', 'TU_CHOI') NOT NULL DEFAULT 'MOI_TAO_BIEN_DONG',
    `supportingCid` VARCHAR(191) NULL,
    `supportingHash` VARCHAR(191) NULL,
    `txHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TransferRequest_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileAsset` (
    `id` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `storageStatus` VARCHAR(191) NOT NULL,
    `cid` VARCHAR(191) NULL,
    `hash` VARCHAR(191) NULL,
    `registrationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `payload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_applicantId_fkey` FOREIGN KEY (`applicantId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileAsset` ADD CONSTRAINT `FileAsset_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
