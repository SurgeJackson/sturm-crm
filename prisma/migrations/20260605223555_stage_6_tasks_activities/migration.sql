-- CreateEnum
CREATE TYPE "TaskRecordType" AS ENUM ('TASK', 'TOUCH');

-- CreateEnum
CREATE TYPE "TaskActionType" AS ENUM ('CALL', 'INCOMING_CALL', 'WHATSAPP', 'TELEGRAM', 'EMAIL', 'SHOWROOM_MEETING', 'OUTSIDE_MEETING', 'PRESENTATION', 'PROPOSAL_SENT', 'FOLLOW_UP', 'REQUEST_PLANS', 'TERMS_APPROVAL', 'SHOWROOM_INVITE', 'EVENT_INVITE', 'INTERNAL_TASK', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskAutoRule" AS ENUM ('PROPOSAL_FOLLOW_UP', 'DESIGNER_REACTIVATION', 'FROZEN_OBJECT_RETURN', 'DEAL_WITHOUT_NEXT_STEP', 'CLIENT_WITHOUT_NEXT_CONTACT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'RECORDED';
ALTER TYPE "TaskStatus" ADD VALUE 'NEEDS_NEXT_STEP';
ALTER TYPE "TaskStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "TaskActivity" ADD COLUMN     "actionType" "TaskActionType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "autoRule" "TaskAutoRule",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "designerId" TEXT,
ADD COLUMN     "isAutoCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextStepAt" TIMESTAMP(3),
ADD COLUMN     "nextStepText" TEXT,
ADD COLUMN     "objectParticipantId" TEXT,
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "recordType" "TaskRecordType" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "result" TEXT;

-- CreateIndex
CREATE INDEX "TaskActivity_recordType_idx" ON "TaskActivity"("recordType");

-- CreateIndex
CREATE INDEX "TaskActivity_status_idx" ON "TaskActivity"("status");

-- CreateIndex
CREATE INDEX "TaskActivity_dueAt_idx" ON "TaskActivity"("dueAt");

-- CreateIndex
CREATE INDEX "TaskActivity_responsibleId_idx" ON "TaskActivity"("responsibleId");

-- CreateIndex
CREATE INDEX "TaskActivity_clientId_idx" ON "TaskActivity"("clientId");

-- CreateIndex
CREATE INDEX "TaskActivity_designerId_idx" ON "TaskActivity"("designerId");

-- CreateIndex
CREATE INDEX "TaskActivity_projectObjectId_idx" ON "TaskActivity"("projectObjectId");

-- CreateIndex
CREATE INDEX "TaskActivity_dealId_idx" ON "TaskActivity"("dealId");

-- CreateIndex
CREATE INDEX "TaskActivity_proposalId_idx" ON "TaskActivity"("proposalId");

-- CreateIndex
CREATE INDEX "TaskActivity_objectParticipantId_idx" ON "TaskActivity"("objectParticipantId");

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_objectParticipantId_fkey" FOREIGN KEY ("objectParticipantId") REFERENCES "ProjectObjectParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
