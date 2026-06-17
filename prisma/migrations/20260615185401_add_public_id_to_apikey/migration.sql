/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `public_id` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "public_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_public_id_key" ON "api_keys"("public_id");
