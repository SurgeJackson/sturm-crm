/*
  Warnings:

  - The `status` column on the `ProjectObject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `city` to the `ProjectObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `ProjectObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectType` to the `ProjectObject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ObjectType" AS ENUM ('APARTMENT', 'PRIVATE_HOUSE', 'APARTMENTS_COMPLEX', 'HOTEL', 'APART_HOTEL', 'RESTAURANT', 'OFFICE', 'MEDICAL', 'FITNESS_POOL', 'RESIDENTIAL_COMPLEX', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ObjectInterestCategory" AS ENUM ('SANITARY_WARE', 'MIXERS', 'SHOWER_SYSTEMS', 'BATHROOM_FURNITURE', 'ACCESSORIES', 'TILES', 'MIRRORS', 'COMMERCIAL_SANITARY', 'OTHER');

-- CreateEnum
CREATE TYPE "ObjectStage" AS ENUM ('NEW_OBJECT', 'INFO_COLLECTION', 'DESIGN_STAGE', 'CALCULATION', 'APPROVAL', 'PURCHASE', 'DELIVERY_IMPLEMENTATION', 'COMPLETED', 'FROZEN', 'LOST');

-- CreateEnum
CREATE TYPE "ObjectStatus" AS ENUM ('ACTIVE', 'FROZEN', 'COMPLETED', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectObjectParticipantType" AS ENUM ('PURCHASE_INFLUENCER', 'IMPLEMENTATION_CONTACT');

-- CreateEnum
CREATE TYPE "InfluenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "InfluenceType" AS ENUM ('BUDGET', 'BRAND', 'FINAL_DECISION', 'TECHNICAL_SOLUTION', 'DEADLINES', 'PAYMENT_TERMS', 'SUPPLIER_CHOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "AttitudeToSturm" AS ENUM ('LOYAL', 'NEUTRAL', 'AGAINST', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ChangeApproval" AS ENUM ('YES', 'NO', 'PARTIALLY');

-- AlterTable
ALTER TABLE "CommercialProposal" ADD COLUMN     "projectObjectId" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "projectObjectId" TEXT;

-- AlterTable
ALTER TABLE "ProjectObject" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bathroomsCount" INTEGER,
ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "designerId" TEXT,
ADD COLUMN     "files" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "implementationEndAt" TIMESTAMP(3),
ADD COLUMN     "implementationStartAt" TIMESTAMP(3),
ADD COLUMN     "interestCategories" "ObjectInterestCategory"[],
ADD COLUMN     "objectType" "ObjectType" NOT NULL,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "stage" "ObjectStage" NOT NULL DEFAULT 'NEW_OBJECT',
DROP COLUMN "status",
ADD COLUMN     "status" "ObjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "TaskActivity" ADD COLUMN     "projectObjectId" TEXT;

-- CreateTable
CREATE TABLE "ProjectObjectParticipant" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "participantType" "ProjectObjectParticipantType" NOT NULL,
    "fullName" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "messenger" TEXT,
    "responsibleId" TEXT,
    "comment" TEXT,
    "influenceLevel" "InfluenceLevel",
    "influenceType" "InfluenceType",
    "attitudeToSturm" "AttitudeToSturm",
    "decisionFactors" TEXT,
    "responsibilityZone" TEXT,
    "canApproveChanges" "ChangeApproval",
    "whenToInvolve" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectObjectParticipant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectObject" ADD CONSTRAINT "ProjectObject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObject" ADD CONSTRAINT "ProjectObject_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObjectParticipant" ADD CONSTRAINT "ProjectObjectParticipant_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ProjectObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObjectParticipant" ADD CONSTRAINT "ProjectObjectParticipant_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObjectParticipant" ADD CONSTRAINT "ProjectObjectParticipant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_projectObjectId_fkey" FOREIGN KEY ("projectObjectId") REFERENCES "ProjectObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_projectObjectId_fkey" FOREIGN KEY ("projectObjectId") REFERENCES "ProjectObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_projectObjectId_fkey" FOREIGN KEY ("projectObjectId") REFERENCES "ProjectObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
