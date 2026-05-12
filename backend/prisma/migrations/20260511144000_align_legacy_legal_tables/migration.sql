-- Align legacy legal tables to current Prisma schema names/columns.
-- Handles environments where earlier legal prototype tables already existed.

-- RegistrationDocumentVersion: ensure versionNo + createdBy columns exist.
SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND COLUMN_NAME = 'versionNo'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD COLUMN `versionNo` INT NOT NULL DEFAULT 1 AFTER `documentType`',
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
      AND COLUMN_NAME = 'createdBy'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD COLUMN `createdBy` VARCHAR(191) NULL AFTER `hash`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill from legacy fields if they exist.
SET @has_old_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND COLUMN_NAME = 'versionNumber'
);
SET @sql := IF(
    @has_old_col = 1,
    'UPDATE `RegistrationDocumentVersion` SET `versionNo` = COALESCE(`versionNumber`, 1)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_old_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND COLUMN_NAME = 'createdById'
);
SET @sql := IF(
    @has_old_col = 1,
    'UPDATE `RegistrationDocumentVersion` SET `createdBy` = COALESCE(`createdBy`, `createdById`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- RegistrationSubmitSnapshot: ensure columns expected by current schema.
SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'submittedBy'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `RegistrationSubmitSnapshot` ADD COLUMN `submittedBy` VARCHAR(191) NULL AFTER `registrationId`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'fileVersionIds'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `RegistrationSubmitSnapshot` ADD COLUMN `fileVersionIds` JSON NULL AFTER `legalBasisCode`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'fileIds'
);
SET @sql := IF(
    @has_col = 0,
    'ALTER TABLE `RegistrationSubmitSnapshot` ADD COLUMN `fileIds` JSON NULL AFTER `fileVersionIds`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill snapshot fields from legacy columns.
SET @has_old_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'submittedById'
);
SET @sql := IF(
    @has_old_col = 1,
    'UPDATE `RegistrationSubmitSnapshot` SET `submittedBy` = COALESCE(`submittedBy`, `submittedById`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_old_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND COLUMN_NAME = 'documentVersionIds'
);
SET @sql := IF(
    @has_old_col = 1,
    'UPDATE `RegistrationSubmitSnapshot` SET `fileVersionIds` = COALESCE(`fileVersionIds`, `documentVersionIds`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `RegistrationSubmitSnapshot`
SET `fileVersionIds` = COALESCE(`fileVersionIds`, JSON_ARRAY()),
    `fileIds` = COALESCE(`fileIds`, JSON_ARRAY());

ALTER TABLE `RegistrationSubmitSnapshot`
    MODIFY COLUMN `fileVersionIds` JSON NOT NULL,
    MODIFY COLUMN `fileIds` JSON NOT NULL;

-- Ensure indexes expected by current schema.
SET @has_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND INDEX_NAME = 'reg_doc_version_unique'
);
SET @sql := IF(
    @has_idx = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD UNIQUE INDEX `reg_doc_version_unique`(`registrationId`, `fileAssetId`, `versionNo`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationDocumentVersion'
      AND INDEX_NAME = 'reg_doc_reg_docType_createdAt_idx'
);
SET @sql := IF(
    @has_idx = 0,
    'ALTER TABLE `RegistrationDocumentVersion` ADD INDEX `reg_doc_reg_docType_createdAt_idx`(`registrationId`, `documentType`, `createdAt`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'RegistrationSubmitSnapshot'
      AND INDEX_NAME = 'RegistrationSubmitSnapshot_registrationId_createdAt_idx'
);
SET @sql := IF(
    @has_idx = 0,
    'ALTER TABLE `RegistrationSubmitSnapshot` ADD INDEX `RegistrationSubmitSnapshot_registrationId_createdAt_idx`(`registrationId`, `createdAt`)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
