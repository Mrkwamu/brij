/*
  Warnings:

  - A unique constraint covering the columns `[api_id,public_id]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "api_keys_api_id_public_id_key" ON "api_keys"("api_id", "public_id");
