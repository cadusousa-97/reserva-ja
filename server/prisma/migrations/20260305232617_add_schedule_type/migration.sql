-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('FLOATING', 'FIXED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'FLOATING';
