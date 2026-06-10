-- AlterEnum
ALTER TYPE "TimesheetDayStatus" ADD VALUE 'DAY_OFF';
ALTER TYPE "TimesheetDayStatus" ADD VALUE 'VACATION';
ALTER TYPE "TimesheetDayStatus" ADD VALUE 'SICK_LEAVE';
ALTER TYPE "TimesheetDayStatus" ADD VALUE 'BUSINESS_TRIP';

-- AlterTable
ALTER TABLE "TimesheetDay" ADD COLUMN "scheduleDayStatusId" TEXT;

-- CreateIndex
CREATE INDEX "TimesheetDay_scheduleDayStatusId_idx" ON "TimesheetDay"("scheduleDayStatusId");

-- AddForeignKey
ALTER TABLE "TimesheetDay" ADD CONSTRAINT "TimesheetDay_scheduleDayStatusId_fkey" FOREIGN KEY ("scheduleDayStatusId") REFERENCES "ScheduleDayStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
