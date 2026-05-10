-- Sprint 2 legal core: procedure registry, document versioning, submit snapshot,
-- payment obligations, legal transition fields and status/role expansion.

ALTER TABLE `User`
  MODIFY `role` ENUM(
    'CITIZEN',
    'BUSINESS',
    'RECEPTION_OFFICER',
    'COMMUNE_OFFICER',
    'LAND_REGISTRY_OFFICER',
    'APPROVAL_AUTHORITY',
    'TAX_OFFICER',
    'AUDITOR',
    'ADMIN'
  ) NOT NULL;

ALTER TABLE `Registration`
  MODIFY `status` ENUM(
    'MOI_TAO',
    'CHO_TIEP_NHAN',
    'CAN_BO_SUNG',
    'DA_TIEP_NHAN',
    'CHO_XAC_NHAN_CAP_XA',
    'DA_XAC_NHAN_CAP_XA',
    'DANG_THAM_DINH_VPDKDD',
    'CHO_THUE',
    'CHO_HOAN_THANH_NGHIA_VU_TAI_CHINH',
    'DA_HOAN_THANH_NGHIA_VU_TAI_CHINH',
    'CHO_KY_CAP',
    'DA_KY_CAP',
    'DA_CAP_NHAT_HO_SO_DIA_CHINH',
    'DA_GHI_BLOCKCHAIN',
    'DA_CAP',
    'DA_TRA_KET_QUA',
    'HUY_HO_SO',
    'TU_CHOI'
  ) NOT NULL DEFAULT 'MOI_TAO';

CREATE TABLE `LegalProcedure` (
  `id` VARCHAR(191) NOT NULL,
  `procedureCode` VARCHAR(191) NOT NULL,
  `sourceDecision` VARCHAR(191) NOT NULL,
  `legalBasis` VARCHAR(191) NOT NULL,
  `level` ENUM('XA', 'TINH', 'LIEN_THONG') NOT NULL,
  `authorityActors` JSON NOT NULL,
  `requiresTaxStep` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `LegalProcedure_procedureCode_key`(`procedureCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Registration`
  ADD COLUMN `procedureCode` VARCHAR(191) NULL,
  ADD COLUMN `legalBasisCode` VARCHAR(191) NULL,
  ADD COLUMN `submittedSnapshotLocked` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `cadastralUpdatedAt` DATETIME(3) NULL;

CREATE INDEX `Registration_procedureCode_idx` ON `Registration`(`procedureCode`);

CREATE TABLE `RegistrationDocumentVersion` (
  `id` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `versionNumber` INTEGER NOT NULL,
  `documentType` VARCHAR(191) NOT NULL,
  `storageStatus` VARCHAR(191) NOT NULL,
  `cid` VARCHAR(191) NULL,
  `hash` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'REPLACED', 'LOCKED', 'INVALIDATED') NOT NULL DEFAULT 'ACTIVE',
  `note` VARCHAR(191) NULL,
  `fileAssetId` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `registration_document_version_unique`(`registrationId`, `versionNumber`),
  INDEX `RegistrationDocumentVersion_registrationId_status_idx`(`registrationId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RegistrationSubmitSnapshot` (
  `id` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `snapshotNo` INTEGER NOT NULL,
  `procedureCode` VARCHAR(191) NULL,
  `legalBasisCode` VARCHAR(191) NOT NULL,
  `authorityActor` VARCHAR(191) NOT NULL,
  `documentVersionIds` JSON NOT NULL,
  `submittedById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `registration_snapshot_unique`(`registrationId`, `snapshotNo`),
  INDEX `RegistrationSubmitSnapshot_registrationId_idx`(`registrationId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RegistrationPaymentObligation` (
  `id` VARCHAR(191) NOT NULL,
  `registrationId` VARCHAR(191) NOT NULL,
  `type` ENUM('INTAKE_FEE', 'LAND_FINANCIAL_OBLIGATION') NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `legalBasisCode` VARCHAR(191) NOT NULL,
  `referenceNo` VARCHAR(191) NULL,
  `amount` DECIMAL(12,2) NULL,
  `note` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `confirmedById` VARCHAR(191) NULL,
  `confirmedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `RegistrationPaymentObligation_registrationId_type_status_idx`(`registrationId`, `type`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Registration`
  ADD CONSTRAINT `Registration_procedureCode_fkey`
  FOREIGN KEY (`procedureCode`) REFERENCES `LegalProcedure`(`procedureCode`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `RegistrationDocumentVersion`
  ADD CONSTRAINT `RegistrationDocumentVersion_registrationId_fkey`
  FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RegistrationDocumentVersion`
  ADD CONSTRAINT `RegistrationDocumentVersion_fileAssetId_fkey`
  FOREIGN KEY (`fileAssetId`) REFERENCES `FileAsset`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `RegistrationDocumentVersion`
  ADD CONSTRAINT `RegistrationDocumentVersion_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `RegistrationSubmitSnapshot`
  ADD CONSTRAINT `RegistrationSubmitSnapshot_registrationId_fkey`
  FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RegistrationSubmitSnapshot`
  ADD CONSTRAINT `RegistrationSubmitSnapshot_submittedById_fkey`
  FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RegistrationPaymentObligation`
  ADD CONSTRAINT `RegistrationPaymentObligation_registrationId_fkey`
  FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RegistrationPaymentObligation`
  ADD CONSTRAINT `RegistrationPaymentObligation_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `RegistrationPaymentObligation`
  ADD CONSTRAINT `RegistrationPaymentObligation_confirmedById_fkey`
  FOREIGN KEY (`confirmedById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
