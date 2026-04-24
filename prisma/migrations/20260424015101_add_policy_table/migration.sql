-- CreateEnum
CREATE TYPE "AlgorithmType" AS ENUM ('fixed_window', 'sliding_window', 'token_bucket', 'leaky_bucket');

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "apikey_id" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 100,
    "window" INTEGER NOT NULL DEFAULT 60,
    "type" "AlgorithmType" NOT NULL DEFAULT 'token_bucket',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policies_apikey_id_key" ON "policies"("apikey_id");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_apikey_id_fkey" FOREIGN KEY ("apikey_id") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
