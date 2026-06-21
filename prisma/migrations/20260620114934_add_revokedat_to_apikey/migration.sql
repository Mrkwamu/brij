/*
  Warnings:

  - You are about to drop the column `expired_at` on the `api_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "expired_at",
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "revoked_at" TIMESTAMP(3);
