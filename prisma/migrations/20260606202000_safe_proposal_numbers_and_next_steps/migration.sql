CREATE TABLE "ProposalCounter" (
  "year" INTEGER NOT NULL,
  "nextNumber" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProposalCounter_pkey" PRIMARY KEY ("year")
);

INSERT INTO "ProposalCounter" ("year", "nextNumber", "createdAt", "updatedAt")
SELECT "proposalYear", MAX("proposalSequence") + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT
    CAST(substring("proposalNumber" from '^КП-([0-9]{4})-[0-9]+$') AS INTEGER) AS "proposalYear",
    CAST(substring("proposalNumber" from '^КП-[0-9]{4}-([0-9]+)$') AS INTEGER) AS "proposalSequence"
  FROM "CommercialProposal"
  WHERE "proposalNumber" ~ '^КП-[0-9]{4}-[0-9]+$'
) AS "existingProposalNumbers"
GROUP BY "proposalYear";

ALTER TABLE "TaskActivity"
ADD COLUMN "nextStepSourceTaskId" TEXT;

CREATE UNIQUE INDEX "TaskActivity_nextStepSourceTaskId_key"
ON "TaskActivity"("nextStepSourceTaskId");
