SET @has_file_ids := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'RegistrationSubmitSnapshot'
    AND COLUMN_NAME = 'fileIds'
);

SET @sql := IF(
  @has_file_ids > 0,
  'ALTER TABLE `RegistrationSubmitSnapshot` MODIFY COLUMN `fileIds` JSON NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
