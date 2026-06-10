-- CreateEnum
CREATE TYPE "SchedulePlanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RETURNED_FOR_REVISION', 'REQUIRES_REAPPROVAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SchedulePlanCellType" AS ENUM ('SHIFT', 'DAY_OFF', 'VACATION', 'SICK_LEAVE', 'BUSINESS_TRIP', 'EMPTY');

-- CreateEnum
CREATE TYPE "SchedulePlanApprovalAction" AS ENUM ('CREATED', 'SAVED_DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED_FOR_REVISION', 'CHANGED_AFTER_APPROVAL', 'NEW_VERSION_CREATED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'SCHEDULE_PLAN';
ALTER TYPE "AuditEntityType" ADD VALUE 'SCHEDULE_PLAN_CELL';
ALTER TYPE "AuditEntityType" ADD VALUE 'SCHEDULE_PLAN_APPROVAL_LOG';

-- CreateTable
CREATE TABLE "SchedulePlan" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SchedulePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "createdById" TEXT NOT NULL,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "returnedById" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnComment" TEXT,
    "basedOnSchedulePlanId" TEXT,
    "isCurrentApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePlanCell" (
    "id" TEXT NOT NULL,
    "schedulePlanId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "cellType" "SchedulePlanCellType" NOT NULL DEFAULT 'EMPTY',
    "shiftTemplateId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "breakMinutes" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulePlanCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePlanApprovalLog" (
    "id" TEXT NOT NULL,
    "schedulePlanId" TEXT NOT NULL,
    "action" "SchedulePlanApprovalAction" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulePlanApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePlan_locationId_year_month_version_key" ON "SchedulePlan"("locationId", "year", "month", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePlan_current_approved_unique" ON "SchedulePlan"("locationId", "year", "month") WHERE "isCurrentApproved" = true;

-- CreateIndex
CREATE INDEX "SchedulePlan_locationId_year_month_idx" ON "SchedulePlan"("locationId", "year", "month");

-- CreateIndex
CREATE INDEX "SchedulePlan_status_idx" ON "SchedulePlan"("status");

-- CreateIndex
CREATE INDEX "SchedulePlan_createdById_idx" ON "SchedulePlan"("createdById");

-- CreateIndex
CREATE INDEX "SchedulePlan_submittedById_idx" ON "SchedulePlan"("submittedById");

-- CreateIndex
CREATE INDEX "SchedulePlan_approvedById_idx" ON "SchedulePlan"("approvedById");

-- CreateIndex
CREATE INDEX "SchedulePlan_returnedById_idx" ON "SchedulePlan"("returnedById");

-- CreateIndex
CREATE INDEX "SchedulePlan_basedOnSchedulePlanId_idx" ON "SchedulePlan"("basedOnSchedulePlanId");

-- CreateIndex
CREATE INDEX "SchedulePlan_isCurrentApproved_idx" ON "SchedulePlan"("isCurrentApproved");

-- CreateIndex
CREATE UNIQUE INDEX "SchedulePlanCell_schedulePlanId_employeeId_date_key" ON "SchedulePlanCell"("schedulePlanId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_schedulePlanId_idx" ON "SchedulePlanCell"("schedulePlanId");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_employeeId_idx" ON "SchedulePlanCell"("employeeId");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_userId_idx" ON "SchedulePlanCell"("userId");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_locationId_idx" ON "SchedulePlanCell"("locationId");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_date_idx" ON "SchedulePlanCell"("date");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_cellType_idx" ON "SchedulePlanCell"("cellType");

-- CreateIndex
CREATE INDEX "SchedulePlanCell_shiftTemplateId_idx" ON "SchedulePlanCell"("shiftTemplateId");

-- CreateIndex
CREATE INDEX "SchedulePlanApprovalLog_schedulePlanId_idx" ON "SchedulePlanApprovalLog"("schedulePlanId");

-- CreateIndex
CREATE INDEX "SchedulePlanApprovalLog_actorUserId_idx" ON "SchedulePlanApprovalLog"("actorUserId");

-- CreateIndex
CREATE INDEX "SchedulePlanApprovalLog_action_idx" ON "SchedulePlanApprovalLog"("action");

-- CreateIndex
CREATE INDEX "SchedulePlanApprovalLog_createdAt_idx" ON "SchedulePlanApprovalLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlan" ADD CONSTRAINT "SchedulePlan_basedOnSchedulePlanId_fkey" FOREIGN KEY ("basedOnSchedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanCell" ADD CONSTRAINT "SchedulePlanCell_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanCell" ADD CONSTRAINT "SchedulePlanCell_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanCell" ADD CONSTRAINT "SchedulePlanCell_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanCell" ADD CONSTRAINT "SchedulePlanCell_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanCell" ADD CONSTRAINT "SchedulePlanCell_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanApprovalLog" ADD CONSTRAINT "SchedulePlanApprovalLog_schedulePlanId_fkey" FOREIGN KEY ("schedulePlanId") REFERENCES "SchedulePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePlanApprovalLog" ADD CONSTRAINT "SchedulePlanApprovalLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
