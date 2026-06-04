/*
  Warnings:

  - The `name` column on the `Plan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "name",
ADD COLUMN     "name" "PlanType" NOT NULL DEFAULT 'free';

-- DropEnum
DROP TYPE "PlanName";

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
