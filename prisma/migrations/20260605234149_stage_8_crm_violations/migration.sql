-- CreateEnum
CREATE TYPE "CrmViolationSeverity" AS ENUM ('CRITICAL', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CrmViolationStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'IGNORED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'CRM_VIOLATION';

-- CreateTable
CREATE TABLE "CrmViolation" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "severity" "CrmViolationSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "responsibleId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "status" "CrmViolationStatus" NOT NULL DEFAULT 'ACTIVE',
    "canAffectBonus" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmViolation_entityType_entityId_idx" ON "CrmViolation"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "CrmViolation_violationCode_idx" ON "CrmViolation"("violationCode");

-- CreateIndex
CREATE INDEX "CrmViolation_severity_idx" ON "CrmViolation"("severity");

-- CreateIndex
CREATE INDEX "CrmViolation_status_idx" ON "CrmViolation"("status");

-- CreateIndex
CREATE INDEX "CrmViolation_responsibleId_idx" ON "CrmViolation"("responsibleId");

-- CreateIndex
CREATE INDEX "CrmViolation_detectedAt_idx" ON "CrmViolation"("detectedAt");

-- AddForeignKey
ALTER TABLE "CrmViolation" ADD CONSTRAINT "CrmViolation_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmViolation" ADD CONSTRAINT "CrmViolation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
