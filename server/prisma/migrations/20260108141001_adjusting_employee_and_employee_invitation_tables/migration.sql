/*
  Warnings:

  - Made the column `userId` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('ACCEPTED', 'DECLINED', 'PENDING');

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_userId_fkey";

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeInvitation" ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
