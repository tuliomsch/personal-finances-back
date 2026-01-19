/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transfer_to_id` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transaction_hash]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_hash` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'CSV', 'MAIL');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('CONTAINS', 'EXACT', 'STARTS_WITH', 'ENDS_WITH');

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_transfer_to_id_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "CategoryType" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "deleted_at",
DROP COLUMN "transfer_to_id",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "raw_description" TEXT,
ADD COLUMN     "source" "SourceType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "transaction_hash" TEXT NOT NULL,
ADD COLUMN     "transferToId" INTEGER;

-- CreateTable
CREATE TABLE "merchant_rules" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "keyword" TEXT NOT NULL,
    "target_name" TEXT NOT NULL,
    "target_category_id" INTEGER,
    "match_type" "MatchType" NOT NULL DEFAULT 'CONTAINS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_hash_key" ON "transactions"("transaction_hash");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transferToId_fkey" FOREIGN KEY ("transferToId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_rules" ADD CONSTRAINT "merchant_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_rules" ADD CONSTRAINT "merchant_rules_target_category_id_fkey" FOREIGN KEY ("target_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
