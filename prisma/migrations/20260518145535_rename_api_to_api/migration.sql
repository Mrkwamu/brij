/*
  Warnings:

  - You are about to drop the `Api` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Api" DROP CONSTRAINT "Api_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_api_id_fkey";

-- DropTable
DROP TABLE "Api";

-- CreateTable
CREATE TABLE "api" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "api_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "api" ADD CONSTRAINT "api_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "api"("id") ON DELETE CASCADE ON UPDATE CASCADE;
