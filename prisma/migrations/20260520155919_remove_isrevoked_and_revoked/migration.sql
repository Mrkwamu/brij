/*
  Warnings:

  - You are about to drop the column `is_revoked` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `revoked_at` on the `api_keys` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "is_revoked",
DROP COLUMN "revoked_at";
