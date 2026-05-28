-- Hotfix for environments where LegalProcedure table existed before
-- legal-aligned schema finalized.
-- Goal:
-- 1) Ensure `name` column exists.
-- 2) Align `sourceDecision` nullability with Prisma schema.

SET @has_name_col := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'LegalProcedure'
      AND COLUMN_NAME = 'name'
);
SET @sql := IF(
    @has_name_col = 0,
    'ALTER TABLE `LegalProcedure` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT ''Thu tuc phap ly'' AFTER `procedureCode`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `LegalProcedure`
    MODIFY COLUMN `sourceDecision` VARCHAR(191) NULL;

UPDATE `LegalProcedure`
SET `name` = COALESCE(NULLIF(`name`, ''), CONCAT('Thủ tục ', `procedureCode`))
WHERE `name` IS NULL OR `name` = '';
