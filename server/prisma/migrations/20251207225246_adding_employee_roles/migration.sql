-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('OWNER', 'MANAGER', 'REGULAR');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'REGULAR';
