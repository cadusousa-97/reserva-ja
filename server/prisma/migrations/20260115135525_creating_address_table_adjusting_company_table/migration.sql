/*
  Warnings:

  - A unique constraint covering the columns `[cpfCnpj]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpfCnpj` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BEAUTY_SALON', 'BARBERSHOP', 'SPA', 'CLINIC', 'NAIL_SPA', 'LASH_STUDIO', 'OTHER');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companyType" "CompanyType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "cpfCnpj" VARCHAR(14) NOT NULL;

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "complement" TEXT NOT NULL,
    "landmark" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cpfCnpj_key" ON "Company"("cpfCnpj");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
