-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "companyId" UUID,
ADD COLUMN     "role" "EmployeeRole";
