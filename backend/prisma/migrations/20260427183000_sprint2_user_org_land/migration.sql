-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LandParcel` (
    `id` VARCHAR(191) NOT NULL,
    `parcelCode` VARCHAR(191) NOT NULL,
    `provinceCode` VARCHAR(191) NOT NULL,
    `districtName` VARCHAR(191) NOT NULL,
    `communeName` VARCHAR(191) NOT NULL,
    `mapSheetNumber` VARCHAR(191) NOT NULL,
    `parcelNumber` VARCHAR(191) NOT NULL,
    `area` DECIMAL(10, 2) NOT NULL,
    `landUsePurpose` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `ownerUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `land_parcel_unique_code_area`(`parcelCode`, `provinceCode`, `districtName`, `communeName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `organizationId` VARCHAR(191) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL DEFAULT '$legacy$',
    ADD COLUMN `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LandParcel` ADD CONSTRAINT `LandParcel_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
