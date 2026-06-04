-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('active', 'disabled', 'revoked');

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "status" "ApiKeyStatus" NOT NULL DEFAULT 'active';
