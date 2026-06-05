/*
  Warnings:

  - You are about to drop the column `projectObjectId` on the `CommercialProposal` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CommercialProposal` table. All the data in the column will be lost.
  - The `status` column on the `CommercialProposal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[proposalNumber]` on the table `CommercialProposal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `CommercialProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `CommercialProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectId` to the `CommercialProposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposalNumber` to the `CommercialProposal` table without a default value. This is not possible if the table is not empty.
  - Made the column `dealId` on table `CommercialProposal` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CommercialProposalStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'SENT', 'CLIENT_THINKING', 'NEEDS_RECALCULATION', 'NEW_VERSION_CREATED', 'ACCEPTED', 'DECLINED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('CLIENT', 'DESIGNER', 'PURCHASE_INFLUENCER', 'IMPLEMENTATION_CONTACT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProposalDeclineReason" AS ENUM ('PRICE', 'DEADLINES', 'ASSORTMENT', 'COMPETITOR', 'CHINA', 'SELF_PURCHASE', 'PROJECT_FROZEN', 'CLIENT_DISAPPEARED', 'DESIGNER_NOT_SUPPORT', 'PROCUREMENT_CHOSE_OTHER', 'OTHER');

-- DropForeignKey
ALTER TABLE "CommercialProposal" DROP CONSTRAINT "CommercialProposal_dealId_fkey";

-- DropForeignKey
ALTER TABLE "CommercialProposal" DROP CONSTRAINT "CommercialProposal_projectObjectId_fkey";

-- AlterTable
ALTER TABLE "CommercialProposal" DROP COLUMN "projectObjectId",
DROP COLUMN "title",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "approvalRequiredFrom" TEXT,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "declineComment" TEXT,
ADD COLUMN     "declineReason" "ProposalDeclineReason",
ADD COLUMN     "designerId" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "fileMimeType" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "nextTouchAt" TIMESTAMP(3),
ADD COLUMN     "objectId" TEXT NOT NULL,
ADD COLUMN     "parentProposalId" TEXT,
ADD COLUMN     "proposalNumber" TEXT NOT NULL,
ADD COLUMN     "recipientContact" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientType" "RecipientType",
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "uploadedAt" TIMESTAMP(3),
ADD COLUMN     "uploadedById" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "status",
ADD COLUMN     "status" "CommercialProposalStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "dealId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TaskActivity" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "proposalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CommercialProposal_proposalNumber_key" ON "CommercialProposal"("proposalNumber");

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ProjectObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_parentProposalId_fkey" FOREIGN KEY ("parentProposalId") REFERENCES "CommercialProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "CommercialProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
