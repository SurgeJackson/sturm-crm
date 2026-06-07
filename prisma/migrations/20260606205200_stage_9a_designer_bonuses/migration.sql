-- CreateEnum
CREATE TYPE "DesignerBonusAgreementType" AS ENUM ('STANDARD_PERCENT', 'INDIVIDUAL_PERCENT', 'FIXED_AMOUNT', 'MANUAL_ONLY', 'NO_BONUS');

-- CreateEnum
CREATE TYPE "DesignerBonusCalculationBase" AS ENUM ('PAYMENT_AMOUNT', 'DEAL_AMOUNT', 'PROPOSAL_AMOUNT', 'MARGIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "DesignerBonusAppliesTo" AS ENUM ('ALL_DEALS', 'SPECIFIC_OBJECTS', 'SPECIFIC_DEALS', 'MANUAL_SELECTION');

-- CreateEnum
CREATE TYPE "DesignerBonusAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PREPAYMENT', 'PARTIAL_PAYMENT', 'FINAL_PAYMENT', 'REFUND', 'CORRECTION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('MANUAL', 'IMPORT', 'ACCOUNTING', 'BANK_IMPORT');

-- CreateEnum
CREATE TYPE "DesignerBonusAccrualType" AS ENUM ('AUTO_FROM_PAYMENT', 'MANUAL', 'CORRECTION', 'REFUND_REVERSAL');

-- CreateEnum
CREATE TYPE "DesignerBonusAccrualStatus" AS ENUM ('DRAFT', 'ACCRUED', 'APPROVED', 'CANCELLED', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "DesignerBonusPayoutMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD_TRANSFER', 'OFFSET', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignerBonusPayoutStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DesignerBonusAdjustmentType" AS ENUM ('ADDITIONAL_ACCRUAL', 'WRITE_OFF', 'CORRECTION_PLUS', 'CORRECTION_MINUS', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntityType" ADD VALUE 'PAYMENT';
ALTER TYPE "AuditEntityType" ADD VALUE 'DESIGNER_BONUS_AGREEMENT';
ALTER TYPE "AuditEntityType" ADD VALUE 'DESIGNER_BONUS_ACCRUAL';
ALTER TYPE "AuditEntityType" ADD VALUE 'DESIGNER_BONUS_PAYOUT';
ALTER TYPE "AuditEntityType" ADD VALUE 'DESIGNER_BONUS_ADJUSTMENT';

-- CreateTable
CREATE TABLE "DesignerBonusAgreement" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "agreementType" "DesignerBonusAgreementType" NOT NULL DEFAULT 'STANDARD_PERCENT',
    "bonusPercent" DOUBLE PRECISION,
    "calculationBase" "DesignerBonusCalculationBase" NOT NULL DEFAULT 'PAYMENT_AMOUNT',
    "appliesTo" "DesignerBonusAppliesTo" NOT NULL DEFAULT 'ALL_DEALS',
    "specificDealIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" "DesignerBonusAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DesignerBonusAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "designerId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'PARTIAL_PAYMENT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "PaymentSource" NOT NULL DEFAULT 'MANUAL',
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignerBonusAccrual" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "agreementId" TEXT,
    "paymentId" TEXT,
    "dealId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "bonusPercent" DOUBLE PRECISION NOT NULL,
    "bonusAmount" DOUBLE PRECISION NOT NULL,
    "accrualDate" TIMESTAMP(3) NOT NULL,
    "status" "DesignerBonusAccrualStatus" NOT NULL DEFAULT 'ACCRUED',
    "accrualType" "DesignerBonusAccrualType" NOT NULL DEFAULT 'AUTO_FROM_PAYMENT',
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DesignerBonusAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignerBonusPayout" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payoutDate" TIMESTAMP(3) NOT NULL,
    "payoutMethod" "DesignerBonusPayoutMethod" NOT NULL,
    "status" "DesignerBonusPayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "linkedAccrualIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comment" TEXT,
    "documentFileUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidById" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DesignerBonusPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignerBonusAdjustment" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "adjustmentType" "DesignerBonusAdjustmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DesignerBonusAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" "AuditEntityType",
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_designerId_idx" ON "DesignerBonusAgreement"("designerId");

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_status_idx" ON "DesignerBonusAgreement"("status");

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_validFrom_idx" ON "DesignerBonusAgreement"("validFrom");

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_validTo_idx" ON "DesignerBonusAgreement"("validTo");

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_archivedAt_idx" ON "DesignerBonusAgreement"("archivedAt");

-- CreateIndex
CREATE INDEX "DesignerBonusAgreement_designerId_status_validFrom_idx" ON "DesignerBonusAgreement"("designerId", "status", "validFrom");

-- CreateIndex
CREATE INDEX "Payment_dealId_idx" ON "Payment"("dealId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE INDEX "Payment_objectId_idx" ON "Payment"("objectId");

-- CreateIndex
CREATE INDEX "Payment_designerId_idx" ON "Payment"("designerId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentType_idx" ON "Payment"("paymentType");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_createdById_idx" ON "Payment"("createdById");

-- CreateIndex
CREATE INDEX "Payment_confirmedById_idx" ON "Payment"("confirmedById");

-- CreateIndex
CREATE INDEX "Payment_archivedAt_idx" ON "Payment"("archivedAt");

-- CreateIndex
CREATE INDEX "Payment_designerId_status_paymentDate_idx" ON "Payment"("designerId", "status", "paymentDate");

-- CreateIndex
CREATE INDEX "Payment_dealId_status_paymentDate_idx" ON "Payment"("dealId", "status", "paymentDate");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_designerId_idx" ON "DesignerBonusAccrual"("designerId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_agreementId_idx" ON "DesignerBonusAccrual"("agreementId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_paymentId_idx" ON "DesignerBonusAccrual"("paymentId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_dealId_idx" ON "DesignerBonusAccrual"("dealId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_objectId_idx" ON "DesignerBonusAccrual"("objectId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_clientId_idx" ON "DesignerBonusAccrual"("clientId");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_status_idx" ON "DesignerBonusAccrual"("status");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_accrualType_idx" ON "DesignerBonusAccrual"("accrualType");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_accrualDate_idx" ON "DesignerBonusAccrual"("accrualDate");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_createdById_idx" ON "DesignerBonusAccrual"("createdById");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_approvedById_idx" ON "DesignerBonusAccrual"("approvedById");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_archivedAt_idx" ON "DesignerBonusAccrual"("archivedAt");

-- CreateIndex
CREATE INDEX "DesignerBonusAccrual_designerId_status_accrualDate_idx" ON "DesignerBonusAccrual"("designerId", "status", "accrualDate");

-- CreateIndex
CREATE UNIQUE INDEX "DesignerBonusAccrual_designerId_paymentId_accrualType_key" ON "DesignerBonusAccrual"("designerId", "paymentId", "accrualType");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_designerId_idx" ON "DesignerBonusPayout"("designerId");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_status_idx" ON "DesignerBonusPayout"("status");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_payoutDate_idx" ON "DesignerBonusPayout"("payoutDate");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_createdById_idx" ON "DesignerBonusPayout"("createdById");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_approvedById_idx" ON "DesignerBonusPayout"("approvedById");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_paidById_idx" ON "DesignerBonusPayout"("paidById");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_archivedAt_idx" ON "DesignerBonusPayout"("archivedAt");

-- CreateIndex
CREATE INDEX "DesignerBonusPayout_designerId_status_payoutDate_idx" ON "DesignerBonusPayout"("designerId", "status", "payoutDate");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_designerId_idx" ON "DesignerBonusAdjustment"("designerId");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_adjustmentType_idx" ON "DesignerBonusAdjustment"("adjustmentType");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_createdById_idx" ON "DesignerBonusAdjustment"("createdById");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_approvedById_idx" ON "DesignerBonusAdjustment"("approvedById");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_approvedAt_idx" ON "DesignerBonusAdjustment"("approvedAt");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_archivedAt_idx" ON "DesignerBonusAdjustment"("archivedAt");

-- CreateIndex
CREATE INDEX "DesignerBonusAdjustment_designerId_approvedAt_createdAt_idx" ON "DesignerBonusAdjustment"("designerId", "approvedAt", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityLog_action_idx" ON "SecurityLog"("action");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_entityType_entityId_idx" ON "SecurityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DesignerBonusAgreement" ADD CONSTRAINT "DesignerBonusAgreement_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAgreement" ADD CONSTRAINT "DesignerBonusAgreement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAgreement" ADD CONSTRAINT "DesignerBonusAgreement_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ProjectObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "DesignerBonusAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ProjectObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAccrual" ADD CONSTRAINT "DesignerBonusAccrual_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusPayout" ADD CONSTRAINT "DesignerBonusPayout_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusPayout" ADD CONSTRAINT "DesignerBonusPayout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusPayout" ADD CONSTRAINT "DesignerBonusPayout_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusPayout" ADD CONSTRAINT "DesignerBonusPayout_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAdjustment" ADD CONSTRAINT "DesignerBonusAdjustment_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAdjustment" ADD CONSTRAINT "DesignerBonusAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonusAdjustment" ADD CONSTRAINT "DesignerBonusAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "CommercialProposal_responsibleId_status_archivedAt_nextTouchAt_" RENAME TO "CommercialProposal_responsibleId_status_archivedAt_nextTouc_idx";

