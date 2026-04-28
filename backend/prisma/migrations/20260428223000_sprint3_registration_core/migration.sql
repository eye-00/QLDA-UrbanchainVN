-- Sprint 3 phase 1: registration core fields for creation/submission/review flow.

ALTER TABLE `Registration`
    ADD COLUMN `provinceCode` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN `communeName` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN `ownerType` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN `ownerFullName` VARCHAR(191) NOT NULL DEFAULT 'Unknown',
    ADD COLUMN `ownerIdentityNumber` VARCHAR(191) NULL,
    ADD COLUMN `ownerAddress` VARCHAR(191) NULL,
    ADD COLUMN `noteHistory` JSON NULL;

UPDATE `Registration`
SET
    `provinceCode` = CASE
        WHEN `provinceCode` = 'UNKNOWN' THEN '48'
        ELSE `provinceCode`
    END,
    `communeName` = CASE
        WHEN `communeName` = 'UNKNOWN' THEN 'Hoa Khanh'
        ELSE `communeName`
    END,
    `ownerFullName` = CASE
        WHEN `ownerFullName` = 'Unknown' THEN 'Chu su dung chua cap nhat'
        ELSE `ownerFullName`
    END,
    `noteHistory` = COALESCE(`noteHistory`, JSON_ARRAY('Khoi tao du lieu tu migration Sprint 3'));
