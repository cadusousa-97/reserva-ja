/*
  Warnings:

  - You are about to alter the column `state` on the `Address` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2)`.
  - You are about to alter the column `zipCode` on the `Address` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(8)`.

*/
-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "state" SET DATA TYPE VARCHAR(2),
ALTER COLUMN "zipCode" SET DATA TYPE VARCHAR(8);
