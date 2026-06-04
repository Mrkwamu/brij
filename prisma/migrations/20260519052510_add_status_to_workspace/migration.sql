-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('active', 'suspended', 'unpaid', 'banned', 'deleted');

-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "status" "WorkspaceStatus" NOT NULL DEFAULT 'active';
