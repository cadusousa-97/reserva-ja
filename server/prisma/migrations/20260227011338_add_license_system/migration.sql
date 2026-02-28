-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "licenseId" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "maxCompanies" INTEGER NOT NULL DEFAULT 1,
    "maxEmployeesPerCompany" INTEGER NOT NULL DEFAULT 5,
    "maxServicesPerCompany" INTEGER NOT NULL DEFAULT 20,
    "priceCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "planId" UUID NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerEmail" VARCHAR(150),
    "ownerUserId" UUID,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "License_key_key" ON "License"("key");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
