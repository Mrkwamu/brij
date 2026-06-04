/*
  Warnings:

  - The `type` column on the `policies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `algorithm_type` on the `usage_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "policies" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'token_bucket';

-- AlterTable
ALTER TABLE "usage_logs" DROP COLUMN "algorithm_type";

-- DropEnum
DROP TYPE "AlgorithmType";
