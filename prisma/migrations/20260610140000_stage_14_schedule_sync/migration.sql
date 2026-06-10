-- CreateEnum
CREATE TYPE "ScheduleDayStatusType" AS ENUM ('DAY_OFF', 'VACATION', 'SICK_LEAVE', 'BUSINESS_TRIP');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'SCHEDULE_DAY_STATUS';

-- AlterTable
ALTER TABLE "WorkShift" ADD COLUMN "sourceSchedulePlanId" TEXT;
ALTER TABLE "WorkShift" ADD COLUMN "sourceSchedulePlanCellId" TEXT;
ALTER TABLE "WorkShift" ADD COLUMN "scheduleVersion" INTEGER;

-- CreateTable
CREATE TABLE "ScheduleDayStatus" (
    "id" TEXT NOT NULL,
    "schedulePlanId" TEXT NOT NULL,
    "schedulePlanCellId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "ScheduleDayStatusType" NOT NULL,
    "comment" TEXT,
    "scheduleVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleDayStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkShift_sourceSchedulePlanCellId_key" ON "WorkShift"("sourceSchedulePlanCellId");

-- CreateIndex
CREATE INDEX "WorkShift_sourceSchedulePlanId_idx" ON "WorkShift"("sourceSchedulePlanId");

-- CreateIndex
CREATE INDEX "WorkShift_scheduleVersion_idx" ON "WorkShift"("scheduleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDayStatus_schedulePlanCellId_key" ON "ScheduleDayStatus"("schedulePlanCellId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleDayStatus_employeeId_date_key" ON "ScheduleDayStatus"("employeeId", "date");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_schedulePlanId_idx" ON "ScheduleDayStatus"("schedulePlanId");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_employeeId_idx" ON "ScheduleDayStatus"("employeeId");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_userId_idx" ON "ScheduleDayStatus"("userId");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_locationId_idx" ON "ScheduleDayStatus"("locationId");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_date_idx" ON "ScheduleDayStatus"("date");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_status_idx" ON "ScheduleDayStatus"("status");

-- CreateIndex
CREATE INDEX "ScheduleDayStatus_scheduleVersion_idx" ON "ScheduleDayStatus"("scheduleVersion");

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_sourceSchedulePlanId_fkey" FOREIGN KEY ("sourceSchedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_sourceSchedulePlanCellId_fkey" FOREIGN KEY ("sourceSchedulePlanCellId") REFERENCES "SchedulePlanCell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDayStatus" ADD CONSTRAINT "ScheduleDayStatus_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDayStatus" ADD CONSTRAINT "ScheduleDayStatus_schedulePlanCellId_fkey" FOREIGN KEY ("schedulePlanCellId") REFERENCES "SchedulePlanCell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDayStatus" ADD CONSTRAINT "ScheduleDayStatus_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDayStatus" ADD CONSTRAINT "ScheduleDayStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDayStatus" ADD CONSTRAINT "ScheduleDayStatus_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
