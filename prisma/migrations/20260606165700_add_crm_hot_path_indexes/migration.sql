CREATE INDEX "Client_responsibleId_status_nextContactAt_idx"
ON "Client"("responsibleId", "status", "nextContactAt");

CREATE INDEX "Client_responsibleId_createdAt_idx"
ON "Client"("responsibleId", "createdAt");

CREATE INDEX "Designer_responsibleId_relationshipStage_lastTouchAt_idx"
ON "Designer"("responsibleId", "relationshipStage", "lastTouchAt");

CREATE INDEX "Designer_responsibleId_nextStepAt_idx"
ON "Designer"("responsibleId", "nextStepAt");

CREATE INDEX "ProjectObject_responsibleId_status_stage_idx"
ON "ProjectObject"("responsibleId", "status", "stage");

CREATE INDEX "ProjectObject_responsibleId_createdAt_idx"
ON "ProjectObject"("responsibleId", "createdAt");

CREATE INDEX "Deal_responsibleId_stage_archivedAt_nextActionAt_idx"
ON "Deal"("responsibleId", "stage", "archivedAt", "nextActionAt");

CREATE INDEX "Deal_responsibleId_createdAt_idx"
ON "Deal"("responsibleId", "createdAt");

CREATE INDEX "CommercialProposal_responsibleId_status_archivedAt_nextTouchAt_idx"
ON "CommercialProposal"("responsibleId", "status", "archivedAt", "nextTouchAt");

CREATE INDEX "CommercialProposal_responsibleId_createdAt_idx"
ON "CommercialProposal"("responsibleId", "createdAt");

CREATE INDEX "TaskActivity_responsibleId_recordType_status_dueAt_idx"
ON "TaskActivity"("responsibleId", "recordType", "status", "dueAt");

CREATE INDEX "TaskActivity_archivedAt_status_dueAt_idx"
ON "TaskActivity"("archivedAt", "status", "dueAt");

CREATE INDEX "TaskActivity_autoRule_archivedAt_status_idx"
ON "TaskActivity"("autoRule", "archivedAt", "status");
