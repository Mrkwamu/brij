/*
  Warnings:

  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_user_id_fkey";

-- AlterTable
ALTER TABLE "policies" ADD COLUMN     "burstLimit" INTEGER;

-- DropTable
DROP TABLE "Plan";

-- DropTable
DROP TABLE "UserPlan";

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" "PlanType" NOT NULL DEFAULT 'free',
    "monthly_quota" INTEGER,
    "max_limit" INTEGER NOT NULL,
    "min_limit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "quota_used" INTEGER NOT NULL,
    "quota_resets_at" TIMESTAMP(3) NOT NULL,
    "status" "SubcribeStatus" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_plans_user_id_key" ON "user_plans"("user_id");

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
