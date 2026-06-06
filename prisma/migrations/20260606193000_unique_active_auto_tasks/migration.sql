CREATE UNIQUE INDEX "TaskActivity_active_proposal_follow_up_uidx"
  ON "TaskActivity"("proposalId")
  WHERE "archivedAt" IS NULL
    AND "autoRule" = 'PROPOSAL_FOLLOW_UP'
    AND "proposalId" IS NOT NULL
    AND "status" NOT IN ('DONE', 'CANCELLED', 'CLOSED');

CREATE UNIQUE INDEX "TaskActivity_active_designer_reactivation_uidx"
  ON "TaskActivity"("designerId")
  WHERE "archivedAt" IS NULL
    AND "autoRule" = 'DESIGNER_REACTIVATION'
    AND "designerId" IS NOT NULL
    AND "status" NOT IN ('DONE', 'CANCELLED', 'CLOSED');

CREATE UNIQUE INDEX "TaskActivity_active_frozen_object_return_uidx"
  ON "TaskActivity"("objectId")
  WHERE "archivedAt" IS NULL
    AND "autoRule" = 'FROZEN_OBJECT_RETURN'
    AND "objectId" IS NOT NULL
    AND "status" NOT IN ('DONE', 'CANCELLED', 'CLOSED');

CREATE UNIQUE INDEX "TaskActivity_active_deal_next_step_uidx"
  ON "TaskActivity"("dealId")
  WHERE "archivedAt" IS NULL
    AND "autoRule" = 'DEAL_WITHOUT_NEXT_STEP'
    AND "dealId" IS NOT NULL
    AND "status" NOT IN ('DONE', 'CANCELLED', 'CLOSED');

CREATE UNIQUE INDEX "TaskActivity_active_client_next_contact_uidx"
  ON "TaskActivity"("clientId")
  WHERE "archivedAt" IS NULL
    AND "autoRule" = 'CLIENT_WITHOUT_NEXT_CONTACT'
    AND "clientId" IS NOT NULL
    AND "status" NOT IN ('DONE', 'CANCELLED', 'CLOSED');
