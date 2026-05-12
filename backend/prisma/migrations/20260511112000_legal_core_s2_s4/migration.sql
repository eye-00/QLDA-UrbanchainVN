-- Legal-aligned Sprint 2-4 core baseline:
-- - Role enum extension (TAX_OFFICER, AUDITOR)
-- - Registration legal status extension
-- - Legal procedure registry + authority matrix
-- - Registration document versioning + submit snapshot
-- - Payment obligation skeleton

ALTER TABLE `User`
    MODIFY COLUMN `role` ENUM(
        'CITIZEN',
        'BUSINESS',
        'RECEPTION_OFFICER',
        'COMMUNE_OFFICER',
        'LAND_REGISTRY_OFFICER',
        'TAX_OFFICER',
        'APPROVAL_AUTHORITY',
        'AUDITOR',
        'ADMIN'
    ) NOT NULL;

ALTER TABLE `Registration`
    MODIFY COLUMN `status` ENUM(
        'MOI_TAO',
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
        'DA_CAP',
        'DA_HOAN_THANH_NGHIA_VU_TAI_CHINH',
        'DA_CAP_NHAT_HO_SO_DIA_CHINH',
        'DA_GHI_BLOCKCHAIN',
        'DA_TRA_KET_QUA',
        'HUY_HO_SO',
        'TU_CHOI'
    ) NOT NULL DEFAULT 'MOI_TAO';

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Registration'
      AND COLUMN_NAME = 'procedureCode'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `Registration` ADD COLUMN `procedureCode` VARCHAR(191) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Registration'
      AND COLUMN_NAME = 'legalBasisCode'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `Registration` ADD COLUMN `legalBasisCode` VARCHAR(191) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Registration'
      AND COLUMN_NAME = 'submitSnapshotAt'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `Registration` ADD COLUMN `submitSnapshotAt` DATETIME(3) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `LegalProcedure` (
    `id` VARCHAR(191) NOT NULL,
    `procedureCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sourceDecision` VARCHAR(191) NULL,
    `legalBasis` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `authorityActors` JSON NOT NULL,
    `requiresTaxStep` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalProcedure_procedureCode_key`(`procedureCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RegistrationDocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `fileAssetId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `versionNo` INTEGER NOT NULL,
    `cid` VARCHAR(191) NULL,
    `hash` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reg_doc_version_unique`(`registrationId`, `fileAssetId`, `versionNo`),
    INDEX `RegistrationDocumentVersion_registrationId_documentType_createdAt_idx`(`registrationId`, `documentType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RegistrationSubmitSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `submittedBy` VARCHAR(191) NULL,
    `procedureCode` VARCHAR(191) NULL,
    `legalBasisCode` VARCHAR(191) NULL,
    `fileVersionIds` JSON NOT NULL,
    `fileIds` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RegistrationSubmitSnapshot_registrationId_createdAt_idx`(`registrationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PaymentObligation` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `type` ENUM('INTAKE_FEE', 'LAND_FINANCIAL_OBLIGATION') NOT NULL,
    `status` ENUM('PENDING', 'FULFILLED', 'WAIVED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(12, 2) NULL,
    `referenceNo` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `fulfilledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentObligation_registrationId_type_status_idx`(`registrationId`, `type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @has_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND CONSTRAINT_NAME = 'RegistrationDocumentVersion_registrationId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
    @has_fk = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD CONSTRAINT `RegistrationDocumentVersion_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND CONSTRAINT_NAME = 'RegistrationDocumentVersion_fileAssetId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
    @has_fk = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD CONSTRAINT `RegistrationDocumentVersion_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `FileAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND CONSTRAINT_NAME = 'RegistrationSubmitSnapshot_registrationId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
    @has_fk = 0,
    'ALTER TABLE `RegistrationSubmitSnapshot` ADD CONSTRAINT `RegistrationSubmitSnapshot_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PaymentObligation'
      AND CONSTRAINT_NAME = 'PaymentObligation_registrationId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
    @has_fk = 0,
    'ALTER TABLE `PaymentObligation` ADD CONSTRAINT `PaymentObligation_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
