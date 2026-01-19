/*
  Warnings:

  - The `bank_name` column on the `accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BankName" AS ENUM ('BANCO_DE_CHILE', 'BANCO_SANTANDER', 'BANCO_ESTADO', 'SCOTIABANK', 'BCI', 'ITAU', 'BANCO_FALABELLA', 'BANCO_RIPLEY', 'BANCO_CONSORCIO', 'BANCO_SECURITY', 'BANCO_BICE', 'BANCO_INTERNACIONAL', 'COOPEUCH', 'TENPO', 'MERCADO_PAGO', 'OTRO');

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "bank_name",
ADD COLUMN     "bank_name" "BankName";
