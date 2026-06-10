-- DropIndex
DROP INDEX IF EXISTS "TimesheetDay_scheduleDayStatusId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetDay_scheduleDayStatusId_key" ON "TimesheetDay"("scheduleDayStatusId");
