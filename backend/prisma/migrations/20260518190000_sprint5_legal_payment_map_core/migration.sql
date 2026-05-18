-- Sprint 5 legal-aligned core: LEG-S5-001 + LEG-S5-002
-- Expand payment obligations and map legal source/state

ALTER TABLE `RegistrationPaymentObligation`
  MODIFY COLUMN `type` ENUM(
    'INTAKE_FEE',
    'LAND_FINANCIAL_OBLIGATION',
    'REGISTRATION_FEE',
    'LATE_FEE',
    'OTHER_LEGAL_FEE'
  ) NOT NULL;

ALTER TABLE `RegistrationPaymentObligation`
  ADD COLUMN `noticeRef` VARCHAR(191) NULL,
  ADD COLUMN `noticeIssuedAt` DATETIME(3) NULL,
  ADD COLUMN `receiptRef` VARCHAR(191) NULL,
  ADD COLUMN `receiptFileId` VARCHAR(191) NULL,
  ADD COLUMN `receiptSubmittedAt` DATETIME(3) NULL,
  ADD COLUMN `verifiedById` VARCHAR(191) NULL,
  ADD COLUMN `verifiedAt` DATETIME(3) NULL,
  ADD COLUMN `verifyNote` VARCHAR(191) NULL,
  ADD COLUMN `evidenceTxHash` VARCHAR(191) NULL,
  ADD COLUMN `evidenceCid` VARCHAR(191) NULL,
  ADD COLUMN `evidenceHash` VARCHAR(191) NULL,
  ADD COLUMN `evidenceRecordedAt` DATETIME(3) NULL;

ALTER TABLE `RegistrationPaymentObligation`
  ADD INDEX `pay_obl_notice_ref_idx` (`noticeRef`),
  ADD INDEX `pay_obl_receipt_ref_idx` (`receiptRef`),
  ADD INDEX `pay_obl_receipt_file_idx` (`receiptFileId`),
  ADD INDEX `pay_obl_verified_by_idx` (`verifiedById`);

ALTER TABLE `RegistrationPaymentObligation`
  ADD CONSTRAINT `pay_obl_receipt_file_fk`
    FOREIGN KEY (`receiptFileId`) REFERENCES `FileAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `pay_obl_verified_by_fk`
    FOREIGN KEY (`verifiedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `LandParcel`
  ADD COLUMN `sourceType` ENUM(
    'DEMO',
    'IMPORTED',
    'OFFICIAL_REFERENCE',
    'UNKNOWN_NEEDS_REVIEW'
  ) NOT NULL DEFAULT 'DEMO',
  ADD COLUMN `geometry` JSON NULL,
  ADD COLUMN `geometryStatus` ENUM(
    'DRAFT',
    'UNDER_REVIEW',
    'OFFCHAIN_APPROVED',
    'BOUNDARY_HASH_RECORDED'
  ) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN `geometryReviewedById` VARCHAR(191) NULL,
  ADD COLUMN `geometryReviewedAt` DATETIME(3) NULL,
  ADD COLUMN `geometryApprovedById` VARCHAR(191) NULL,
  ADD COLUMN `geometryOffchainApprovedAt` DATETIME(3) NULL,
  ADD COLUMN `boundaryHashRecordedById` VARCHAR(191) NULL,
  ADD COLUMN `boundaryHashRecordedAt` DATETIME(3) NULL,
  ADD COLUMN `boundaryHashTxHash` VARCHAR(191) NULL,
  ADD COLUMN `boundaryHashCid` VARCHAR(191) NULL,
  ADD COLUMN `boundaryHashValue` VARCHAR(191) NULL;

ALTER TABLE `LandParcel`
  ADD INDEX `land_source_status_idx` (`sourceType`, `geometryStatus`),
  ADD INDEX `land_geom_review_by_idx` (`geometryReviewedById`),
  ADD INDEX `land_geom_approve_by_idx` (`geometryApprovedById`),
  ADD INDEX `land_boundary_record_by_idx` (`boundaryHashRecordedById`);

ALTER TABLE `LandParcel`
  ADD CONSTRAINT `land_geom_review_by_fk`
    FOREIGN KEY (`geometryReviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `land_geom_approve_by_fk`
    FOREIGN KEY (`geometryApprovedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `land_boundary_record_by_fk`
    FOREIGN KEY (`boundaryHashRecordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
