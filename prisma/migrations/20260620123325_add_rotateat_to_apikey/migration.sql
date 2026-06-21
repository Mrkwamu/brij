-- AlterEnum
ALTER TYPE "ApiKeyStatus" ADD VALUE 'rotate';

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "rotate_at" TIMESTAMP(3);
