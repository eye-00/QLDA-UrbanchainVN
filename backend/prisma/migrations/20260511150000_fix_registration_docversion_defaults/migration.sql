-- Fix legacy RegistrationDocumentVersion required columns so Prisma inserts can run on mixed schemas.

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND COLUMN_NAME = 'storageStatus'
);
SET @sql := IF(
    @has_col = 1,
    'UPDATE `RegistrationDocumentVersion` SET `storageStatus` = ''UPLOADED_IPFS'' WHERE `storageStatus` IS NULL OR `storageStatus` = ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    @has_col = 1,
    'ALTER TABLE `RegistrationDocumentVersion` MODIFY COLUMN `storageStatus` VARCHAR(191) NOT NULL DEFAULT ''UPLOADED_IPFS''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND COLUMN_NAME = 'updatedAt'
);
SET @sql := IF(
    @has_col = 1,
    'UPDATE `RegistrationDocumentVersion` SET `updatedAt` = COALESCE(`updatedAt`, `createdAt`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    @has_col = 1,
    'ALTER TABLE `RegistrationDocumentVersion` MODIFY COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Legacy duplicated JSON column in RegistrationSubmitSnapshot can block inserts
-- when Prisma maps fileVersionIds to documentVersionIds.
SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'fileVersionIds'
);
SET @sql := IF(
    @has_col = 1,
    'ALTER TABLE `RegistrationSubmitSnapshot` MODIFY COLUMN `fileVersionIds` JSON NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
