/*
  Warnings:

  - Made the column `key_name` on table `api_keys` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "key_name" SET NOT NULL;
