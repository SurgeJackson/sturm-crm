-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SALES_LEAD', 'STORE_MANAGER', 'PROJECT_MANAGER', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'LOST', 'SLEEPING');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'LEGAL_ENTITY', 'COMPANY_REPRESENTATIVE', 'DESIGNER_FOR_SELF', 'CUSTOMER_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('SHOWROOM', 'WEBSITE', 'PHONE', 'DESIGNER', 'RECOMMENDATION', 'EXHIBITION', 'SOCIAL_MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('NEW', 'ACTIVE', 'SLEEPING', 'REGULAR', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DesignerRole" AS ENUM ('DESIGNER', 'ARCHITECT', 'BUREAU_HEAD', 'COMPLETER', 'DECORATOR', 'DESIGNER_ASSISTANT', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignerSpecialization" AS ENUM ('APARTMENTS', 'HOUSES', 'COMMERCIAL', 'HORECA', 'HOTELS', 'OFFICES', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignerProjectSegment" AS ENUM ('ECONOMY', 'MIDDLE', 'MIDDLE_PLUS', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "DesignerSource" AS ENUM ('EXHIBITION', 'RECOMMENDATION', 'SOCIAL_MEDIA', 'INCOMING', 'DATABASE', 'SHOWROOM', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DesignerRelationshipStage" AS ENUM ('NEW_CONTACT', 'FIRST_CONTACT', 'INTERESTED', 'INVITED_TO_SHOWROOM', 'MEETING_DONE', 'PRESENTATION_DONE', 'TERMS_DISCUSSING', 'IN_DEVELOPMENT', 'FIRST_OBJECT_RECEIVED', 'ACTIVE_PARTNER', 'KEY_PARTNER', 'SLEEPING', 'LOST_OR_IRRELEVANT');

-- CreateEnum
CREATE TYPE "DesignerPotential" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "DesignerLoyalty" AS ENUM ('COLD', 'NEUTRAL', 'WARM', 'LOYAL', 'AMBASSADOR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING', 'DONE', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('CLIENT', 'DESIGNER', 'OBJECT', 'DEAL', 'PROPOSAL', 'TASK', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "authProviderId" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "phone" TEXT,
    "email" TEXT,
    "messenger" TEXT,
    "city" TEXT,
    "source" "ClientSource" NOT NULL DEFAULT 'SHOWROOM',
    "linkedDesignerId" TEXT,
    "responsibleId" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'NEW',
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "nextContactAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studio" TEXT,
    "role" "DesignerRole" NOT NULL DEFAULT 'DESIGNER',
    "phone" TEXT,
    "email" TEXT,
    "messenger" TEXT,
    "website" TEXT,
    "city" TEXT,
    "specialization" "DesignerSpecialization"[],
    "projectSegment" "DesignerProjectSegment",
    "source" "DesignerSource" NOT NULL DEFAULT 'DATABASE',
    "responsibleId" TEXT NOT NULL,
    "relationshipStage" "DesignerRelationshipStage" NOT NULL DEFAULT 'NEW_CONTACT',
    "potential" "DesignerPotential" NOT NULL DEFAULT 'B',
    "loyalty" "DesignerLoyalty" NOT NULL DEFAULT 'NEUTRAL',
    "cooperationTerms" TEXT,
    "firstContactAt" TIMESTAMP(3),
    "lastTouchAt" TIMESTAMP(3),
    "nextStepAt" TIMESTAMP(3),
    "nextStepText" TEXT,
    "transferredObjectsCount" INTEGER NOT NULL DEFAULT 0,
    "activeObjectsCount" INTEGER NOT NULL DEFAULT 0,
    "proposalsTotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentsTotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Designer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectObject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsibleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProjectObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsibleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialProposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsibleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CommercialProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'NEW',
    "responsibleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_linkedDesignerId_fkey" FOREIGN KEY ("linkedDesignerId") REFERENCES "Designer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designer" ADD CONSTRAINT "Designer_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designer" ADD CONSTRAINT "Designer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObject" ADD CONSTRAINT "ProjectObject_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectObject" ADD CONSTRAINT "ProjectObject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
