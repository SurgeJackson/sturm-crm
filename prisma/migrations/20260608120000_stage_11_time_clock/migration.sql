-- CreateEnum
CREATE TYPE "EmployeeEmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "WorkShiftStatus" AS ENUM ('PLANNED', 'COMPLETED', 'MISSED', 'CANCELLED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "EmployeeDeviceStatus" AS ENUM ('TRUSTED', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LocationDisplayDeviceStatus" AS ENUM ('ACTIVE', 'PENDING', 'BLOCKED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LocationDisplaySessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QrTokenStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TimeEventType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END');

-- CreateEnum
CREATE TYPE "TimeEventSource" AS ENUM ('QR_GEO_WEB', 'MANUAL');

-- CreateEnum
CREATE TYPE "TimeEventStatus" AS ENUM ('ACCEPTED', 'PENDING_REVIEW', 'REJECTED', 'MANUAL');

-- CreateEnum
CREATE TYPE "TimesheetDayStatus" AS ENUM ('SCHEDULED', 'OK', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY_LEAVE', 'MISSING_CHECK_IN', 'MISSING_CHECK_OUT', 'ABSENT', 'PENDING_REVIEW', 'MANUAL_ADJUSTED');

-- CreateEnum
CREATE TYPE "TimeAdjustmentAction" AS ENUM ('ADD_EVENT', 'EDIT_EVENT', 'DELETE_EVENT');

-- CreateEnum
CREATE TYPE "TimeAdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntityType" ADD VALUE 'EMPLOYEE_PROFILE';
ALTER TYPE "AuditEntityType" ADD VALUE 'WORK_LOCATION';
ALTER TYPE "AuditEntityType" ADD VALUE 'WORK_SHIFT';
ALTER TYPE "AuditEntityType" ADD VALUE 'EMPLOYEE_TRUSTED_DEVICE';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOCATION_DISPLAY_DEVICE';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOCATION_DISPLAY_SETUP_TOKEN';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOCATION_DISPLAY_SESSION';
ALTER TYPE "AuditEntityType" ADD VALUE 'QR_TOKEN';
ALTER TYPE "AuditEntityType" ADD VALUE 'TIME_EVENT';
ALTER TYPE "AuditEntityType" ADD VALUE 'TIMESHEET_DAY';
ALTER TYPE "AuditEntityType" ADD VALUE 'TIME_ADJUSTMENT_REQUEST';

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    "defaultLocationId" TEXT,
    "position" TEXT,
    "employmentStatus" "EmployeeEmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "trustedDeviceLimit" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "allowedRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "maxAllowedAccuracyMeters" INTEGER NOT NULL DEFAULT 150,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "allowedIpRanges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "WorkShiftStatus" NOT NULL DEFAULT 'PLANNED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTrustedDevice" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "fingerprintHash" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "status" "EmployeeDeviceStatus" NOT NULL DEFAULT 'PENDING',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "blockedById" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDisplayDevice" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "status" "LocationDisplayDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "lastIpAddress" TEXT,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationDisplayDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDisplaySetupToken" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByDeviceId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationDisplaySetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDisplaySession" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "displayDeviceId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "status" "LocationDisplaySessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "lastIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationDisplaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrToken" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "displayDeviceId" TEXT NOT NULL,
    "displaySessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByEmployeeId" TEXT,
    "status" "QrTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEvent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "shiftId" TEXT,
    "qrTokenId" TEXT,
    "type" "TimeEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clientTime" TIMESTAMP(3),
    "source" "TimeEventSource" NOT NULL DEFAULT 'QR_GEO_WEB',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "distanceFromLocationMeters" DOUBLE PRECISION,
    "deviceId" TEXT,
    "trustedDeviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" "TimeEventStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewComment" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimesheetDay" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "shiftId" TEXT,
    "locationId" TEXT,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualCheckIn" TIMESTAMP(3),
    "actualCheckOut" TIMESTAMP(3),
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "TimesheetDayStatus" NOT NULL DEFAULT 'SCHEDULED',
    "hasPendingEvents" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimesheetDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeAdjustmentRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT,
    "date" TEXT NOT NULL,
    "requestedAction" "TimeAdjustmentAction" NOT NULL,
    "eventType" "TimeEventType",
    "targetEventId" TEXT,
    "requestedOccurredAt" TIMESTAMP(3),
    "comment" TEXT NOT NULL,
    "status" "TimeAdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeAdjustmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_employmentStatus_idx" ON "EmployeeProfile"("employmentStatus");

-- CreateIndex
CREATE INDEX "EmployeeProfile_defaultLocationId_idx" ON "EmployeeProfile"("defaultLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkLocation_code_key" ON "WorkLocation"("code");

-- CreateIndex
CREATE INDEX "WorkLocation_isActive_idx" ON "WorkLocation"("isActive");

-- CreateIndex
CREATE INDEX "WorkLocation_code_idx" ON "WorkLocation"("code");

-- CreateIndex
CREATE INDEX "WorkShift_employeeId_idx" ON "WorkShift"("employeeId");

-- CreateIndex
CREATE INDEX "WorkShift_locationId_idx" ON "WorkShift"("locationId");

-- CreateIndex
CREATE INDEX "WorkShift_date_idx" ON "WorkShift"("date");

-- CreateIndex
CREATE INDEX "WorkShift_status_idx" ON "WorkShift"("status");

-- CreateIndex
CREATE INDEX "WorkShift_employeeId_date_idx" ON "WorkShift"("employeeId", "date");

-- CreateIndex
CREATE INDEX "WorkShift_locationId_date_idx" ON "WorkShift"("locationId", "date");

-- CreateIndex
CREATE INDEX "EmployeeTrustedDevice_deviceId_idx" ON "EmployeeTrustedDevice"("deviceId");

-- CreateIndex
CREATE INDEX "EmployeeTrustedDevice_fingerprintHash_idx" ON "EmployeeTrustedDevice"("fingerprintHash");

-- CreateIndex
CREATE INDEX "EmployeeTrustedDevice_status_idx" ON "EmployeeTrustedDevice"("status");

-- CreateIndex
CREATE INDEX "EmployeeTrustedDevice_lastSeenAt_idx" ON "EmployeeTrustedDevice"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTrustedDevice_employeeId_deviceId_key" ON "EmployeeTrustedDevice"("employeeId", "deviceId");

-- CreateIndex
CREATE INDEX "LocationDisplayDevice_deviceId_idx" ON "LocationDisplayDevice"("deviceId");

-- CreateIndex
CREATE INDEX "LocationDisplayDevice_status_idx" ON "LocationDisplayDevice"("status");

-- CreateIndex
CREATE INDEX "LocationDisplayDevice_lastSeenAt_idx" ON "LocationDisplayDevice"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocationDisplayDevice_locationId_deviceId_key" ON "LocationDisplayDevice"("locationId", "deviceId");

-- CreateIndex
CREATE INDEX "LocationDisplaySetupToken_locationId_idx" ON "LocationDisplaySetupToken"("locationId");

-- CreateIndex
CREATE INDEX "LocationDisplaySetupToken_expiresAt_idx" ON "LocationDisplaySetupToken"("expiresAt");

-- CreateIndex
CREATE INDEX "LocationDisplaySetupToken_usedAt_idx" ON "LocationDisplaySetupToken"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocationDisplaySetupToken_tokenHash_key" ON "LocationDisplaySetupToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LocationDisplaySession_locationId_idx" ON "LocationDisplaySession"("locationId");

-- CreateIndex
CREATE INDEX "LocationDisplaySession_displayDeviceId_idx" ON "LocationDisplaySession"("displayDeviceId");

-- CreateIndex
CREATE INDEX "LocationDisplaySession_status_idx" ON "LocationDisplaySession"("status");

-- CreateIndex
CREATE INDEX "LocationDisplaySession_expiresAt_idx" ON "LocationDisplaySession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocationDisplaySession_sessionHash_key" ON "LocationDisplaySession"("sessionHash");

-- CreateIndex
CREATE INDEX "QrToken_locationId_idx" ON "QrToken"("locationId");

-- CreateIndex
CREATE INDEX "QrToken_displayDeviceId_idx" ON "QrToken"("displayDeviceId");

-- CreateIndex
CREATE INDEX "QrToken_displaySessionId_idx" ON "QrToken"("displaySessionId");

-- CreateIndex
CREATE INDEX "QrToken_status_expiresAt_idx" ON "QrToken"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "QrToken_tokenHash_key" ON "QrToken"("tokenHash");

-- CreateIndex
CREATE INDEX "TimeEvent_employeeId_idx" ON "TimeEvent"("employeeId");

-- CreateIndex
CREATE INDEX "TimeEvent_userId_idx" ON "TimeEvent"("userId");

-- CreateIndex
CREATE INDEX "TimeEvent_locationId_idx" ON "TimeEvent"("locationId");

-- CreateIndex
CREATE INDEX "TimeEvent_shiftId_idx" ON "TimeEvent"("shiftId");

-- CreateIndex
CREATE INDEX "TimeEvent_qrTokenId_idx" ON "TimeEvent"("qrTokenId");

-- CreateIndex
CREATE INDEX "TimeEvent_status_idx" ON "TimeEvent"("status");

-- CreateIndex
CREATE INDEX "TimeEvent_type_idx" ON "TimeEvent"("type");

-- CreateIndex
CREATE INDEX "TimeEvent_occurredAt_idx" ON "TimeEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "TimeEvent_employeeId_occurredAt_idx" ON "TimeEvent"("employeeId", "occurredAt");

-- CreateIndex
CREATE INDEX "TimesheetDay_userId_idx" ON "TimesheetDay"("userId");

-- CreateIndex
CREATE INDEX "TimesheetDay_date_idx" ON "TimesheetDay"("date");

-- CreateIndex
CREATE INDEX "TimesheetDay_shiftId_idx" ON "TimesheetDay"("shiftId");

-- CreateIndex
CREATE INDEX "TimesheetDay_locationId_idx" ON "TimesheetDay"("locationId");

-- CreateIndex
CREATE INDEX "TimesheetDay_status_idx" ON "TimesheetDay"("status");

-- CreateIndex
CREATE INDEX "TimesheetDay_hasPendingEvents_idx" ON "TimesheetDay"("hasPendingEvents");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetDay_employeeId_date_key" ON "TimesheetDay"("employeeId", "date");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_employeeId_idx" ON "TimeAdjustmentRequest"("employeeId");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_userId_idx" ON "TimeAdjustmentRequest"("userId");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_date_idx" ON "TimeAdjustmentRequest"("date");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_status_idx" ON "TimeAdjustmentRequest"("status");

-- CreateIndex
CREATE INDEX "TimeAdjustmentRequest_reviewedById_idx" ON "TimeAdjustmentRequest"("reviewedById");

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "WorkLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrustedDevice" ADD CONSTRAINT "EmployeeTrustedDevice_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrustedDevice" ADD CONSTRAINT "EmployeeTrustedDevice_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrustedDevice" ADD CONSTRAINT "EmployeeTrustedDevice_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplayDevice" ADD CONSTRAINT "LocationDisplayDevice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplayDevice" ADD CONSTRAINT "LocationDisplayDevice_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplayDevice" ADD CONSTRAINT "LocationDisplayDevice_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplaySetupToken" ADD CONSTRAINT "LocationDisplaySetupToken_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplaySetupToken" ADD CONSTRAINT "LocationDisplaySetupToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplaySession" ADD CONSTRAINT "LocationDisplaySession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDisplaySession" ADD CONSTRAINT "LocationDisplaySession_displayDeviceId_fkey" FOREIGN KEY ("displayDeviceId") REFERENCES "LocationDisplayDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_displayDeviceId_fkey" FOREIGN KEY ("displayDeviceId") REFERENCES "LocationDisplayDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_displaySessionId_fkey" FOREIGN KEY ("displaySessionId") REFERENCES "LocationDisplaySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_usedByEmployeeId_fkey" FOREIGN KEY ("usedByEmployeeId") REFERENCES "EmployeeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_qrTokenId_fkey" FOREIGN KEY ("qrTokenId") REFERENCES "QrToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_trustedDeviceId_fkey" FOREIGN KEY ("trustedDeviceId") REFERENCES "EmployeeTrustedDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEvent" ADD CONSTRAINT "TimeEvent_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDay" ADD CONSTRAINT "TimesheetDay_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDay" ADD CONSTRAINT "TimesheetDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDay" ADD CONSTRAINT "TimesheetDay_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimesheetDay" ADD CONSTRAINT "TimesheetDay_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WorkLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "WorkShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_targetEventId_fkey" FOREIGN KEY ("targetEventId") REFERENCES "TimeEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeAdjustmentRequest" ADD CONSTRAINT "TimeAdjustmentRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

