-- Sprint 2 closeout: convert land locality from 3 levels to 2 levels.
-- 1) Remove districtName from schema
-- 2) Keep parcel uniqueness on parcelCode + provinceCode + communeName
-- 3) Auto-rename conflicting parcelCode records with incremental suffixes

DROP INDEX `land_parcel_unique_code_area` ON `LandParcel`;

SET @renamed_count := 0;

CREATE TEMPORARY TABLE `_landparcel_dups_pass_1` AS
SELECT `id`, `parcelCode`, `rn`
FROM (
  SELECT
    `id`,
    `parcelCode`,
    ROW_NUMBER() OVER (
      PARTITION BY `parcelCode`, `provinceCode`, `communeName`
      ORDER BY `createdAt`, `id`
    ) AS `rn`
  FROM `LandParcel`
) ranked
WHERE `rn` > 1;
SELECT COUNT(*) INTO @pass_1_count FROM `_landparcel_dups_pass_1`;
SET @renamed_count := @renamed_count + @pass_1_count;
UPDATE `LandParcel` target
JOIN `_landparcel_dups_pass_1` dup ON dup.`id` = target.`id`
SET target.`parcelCode` = CONCAT(dup.`parcelCode`, '-', LPAD(dup.`rn` - 1, 2, '0'));
DROP TEMPORARY TABLE `_landparcel_dups_pass_1`;

CREATE TEMPORARY TABLE `_landparcel_dups_pass_2` AS
SELECT `id`, `parcelCode`, `rn`
FROM (
  SELECT
    `id`,
    `parcelCode`,
    ROW_NUMBER() OVER (
      PARTITION BY `parcelCode`, `provinceCode`, `communeName`
      ORDER BY `createdAt`, `id`
    ) AS `rn`
  FROM `LandParcel`
) ranked
WHERE `rn` > 1;
SELECT COUNT(*) INTO @pass_2_count FROM `_landparcel_dups_pass_2`;
SET @renamed_count := @renamed_count + @pass_2_count;
UPDATE `LandParcel` target
JOIN `_landparcel_dups_pass_2` dup ON dup.`id` = target.`id`
SET target.`parcelCode` = CONCAT(dup.`parcelCode`, '-', LPAD(dup.`rn` - 1, 2, '0'));
DROP TEMPORARY TABLE `_landparcel_dups_pass_2`;

CREATE TEMPORARY TABLE `_landparcel_dups_pass_3` AS
SELECT `id`, `parcelCode`, `rn`
FROM (
  SELECT
    `id`,
    `parcelCode`,
    ROW_NUMBER() OVER (
      PARTITION BY `parcelCode`, `provinceCode`, `communeName`
      ORDER BY `createdAt`, `id`
    ) AS `rn`
  FROM `LandParcel`
) ranked
WHERE `rn` > 1;
SELECT COUNT(*) INTO @pass_3_count FROM `_landparcel_dups_pass_3`;
SET @renamed_count := @renamed_count + @pass_3_count;
UPDATE `LandParcel` target
JOIN `_landparcel_dups_pass_3` dup ON dup.`id` = target.`id`
SET target.`parcelCode` = CONCAT(dup.`parcelCode`, '-', LPAD(dup.`rn` - 1, 2, '0'));
DROP TEMPORARY TABLE `_landparcel_dups_pass_3`;

CREATE TEMPORARY TABLE `_landparcel_dups_pass_4` AS
SELECT `id`, `parcelCode`, `rn`
FROM (
  SELECT
    `id`,
    `parcelCode`,
    ROW_NUMBER() OVER (
      PARTITION BY `parcelCode`, `provinceCode`, `communeName`
      ORDER BY `createdAt`, `id`
    ) AS `rn`
  FROM `LandParcel`
) ranked
WHERE `rn` > 1;
SELECT COUNT(*) INTO @pass_4_count FROM `_landparcel_dups_pass_4`;
SET @renamed_count := @renamed_count + @pass_4_count;
UPDATE `LandParcel` target
JOIN `_landparcel_dups_pass_4` dup ON dup.`id` = target.`id`
SET target.`parcelCode` = CONCAT(dup.`parcelCode`, '-', LPAD(dup.`rn` - 1, 2, '0'));
DROP TEMPORARY TABLE `_landparcel_dups_pass_4`;

CREATE TEMPORARY TABLE `_landparcel_dups_pass_5` AS
SELECT `id`, `parcelCode`, `rn`
FROM (
  SELECT
    `id`,
    `parcelCode`,
    ROW_NUMBER() OVER (
      PARTITION BY `parcelCode`, `provinceCode`, `communeName`
      ORDER BY `createdAt`, `id`
    ) AS `rn`
  FROM `LandParcel`
) ranked
WHERE `rn` > 1;
SELECT COUNT(*) INTO @pass_5_count FROM `_landparcel_dups_pass_5`;
SET @renamed_count := @renamed_count + @pass_5_count;
UPDATE `LandParcel` target
JOIN `_landparcel_dups_pass_5` dup ON dup.`id` = target.`id`
SET target.`parcelCode` = CONCAT(dup.`parcelCode`, '-', LPAD(dup.`rn` - 1, 2, '0'));
DROP TEMPORARY TABLE `_landparcel_dups_pass_5`;

ALTER TABLE `LandParcel`
    DROP COLUMN `districtName`;

CREATE UNIQUE INDEX `land_parcel_unique_code_area`
    ON `LandParcel`(`parcelCode`, `provinceCode`, `communeName`);

INSERT INTO `AuditLog` (`id`, `actorId`, `action`, `entityType`, `entityId`, `payload`)
VALUES (
    CONCAT('mig_', REPLACE(UUID(), '-', '')),
    NULL,
    'AUTO_RENAMED_PARCEL_CODE_ON_MIGRATION',
    'MIGRATION',
    '20260428193000_landparcel_two_level_locality',
    JSON_OBJECT(
      'event', 'auto_renamed_parcel_code_on_migration',
      'renamedCount', @renamed_count,
      'oldUniqueKey', 'parcelCode+provinceCode+districtName+communeName',
      'newUniqueKey', 'parcelCode+provinceCode+communeName'
    )
);
