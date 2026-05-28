-- AlterTable
ALTER TABLE `AuthSession`
    ADD COLUMN `refreshTokenFingerprint` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AuthSession_refreshTokenFingerprint_revokedAt_expiresAt_idx`
    ON `AuthSession`(`refreshTokenFingerprint`, `revokedAt`, `expiresAt`);
