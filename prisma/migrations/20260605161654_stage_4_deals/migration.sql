/*
  Warnings:

  - You are about to drop the column `projectObjectId` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Deal` table. All the data in the column will be lost.
  - Added the required column `clientId` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectId` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('NEW_REQUEST', 'QUALIFICATION', 'SELECTION', 'PROPOSAL_IN_PROGRESS', 'PROPOSAL_SENT', 'WAITING_DECISION', 'NEGOTIATION', 'INVOICE_OR_ORDER', 'PAID', 'IN_DELIVERY', 'COMPLETED', 'LOST');

-- CreateEnum
CREATE TYPE "DealProbability" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "DealSource" AS ENUM ('DESIGNER', 'SHOWROOM', 'WEBSITE', 'PHONE', 'RECOMMENDATION', 'REPEAT_CLIENT', 'COMMERCIAL_PROJECT', 'OTHER');

-- CreateEnum
CREATE TYPE "DealLossReason" AS ENUM ('PRICE', 'DEADLINES', 'COMPETITOR', 'CHINA', 'SELF_PURCHASE', 'CLIENT_DISAPPEARED', 'ASSORTMENT', 'PAYMENT_TERMS', 'DELIVERY_TERMS', 'DESIGNER_NOT_SUPPORT', 'PROCUREMENT_CHOSE_OTHER', 'PROJECT_FROZEN', 'OTHER');

-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_projectObjectId_fkey";

-- AlterTable
ALTER TABLE "CommercialProposal" ADD COLUMN     "dealId" TEXT;

-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "projectObjectId",
DROP COLUMN "status",
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "designerId" TEXT,
ADD COLUMN     "lossComment" TEXT,
ADD COLUMN     "lossReason" "DealLossReason",
ADD COLUMN     "nextActionAt" TIMESTAMP(3),
ADD COLUMN     "nextActionText" TEXT,
ADD COLUMN     "objectId" TEXT NOT NULL,
ADD COLUMN     "potentialAmount" DOUBLE PRECISION,
ADD COLUMN     "probability" "DealProbability",
ADD COLUMN     "source" "DealSource" NOT NULL,
ADD COLUMN     "stage" "DealStage" NOT NULL DEFAULT 'NEW_REQUEST';

-- AlterTable
ALTER TABLE "TaskActivity" ADD COLUMN     "dealId" TEXT;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ProjectObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
