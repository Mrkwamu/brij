-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "key_name" TEXT DEFAULT 'untitled key';

-- AlterTable
ALTER TABLE "policies" ALTER COLUMN "limit" DROP NOT NULL,
ALTER COLUMN "window" DROP NOT NULL;
