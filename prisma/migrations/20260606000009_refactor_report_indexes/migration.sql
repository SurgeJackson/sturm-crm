-- CreateIndex
CREATE INDEX "Client_responsibleId_idx" ON "Client"("responsibleId");

-- CreateIndex
CREATE INDEX "Client_createdById_idx" ON "Client"("createdById");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_source_idx" ON "Client"("source");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Client_nextContactAt_idx" ON "Client"("nextContactAt");

-- CreateIndex
CREATE INDEX "CommercialProposal_responsibleId_idx" ON "CommercialProposal"("responsibleId");

-- CreateIndex
CREATE INDEX "CommercialProposal_createdById_idx" ON "CommercialProposal"("createdById");

-- CreateIndex
CREATE INDEX "CommercialProposal_dealId_idx" ON "CommercialProposal"("dealId");

-- CreateIndex
CREATE INDEX "CommercialProposal_clientId_idx" ON "CommercialProposal"("clientId");

-- CreateIndex
CREATE INDEX "CommercialProposal_objectId_idx" ON "CommercialProposal"("objectId");

-- CreateIndex
CREATE INDEX "CommercialProposal_designerId_idx" ON "CommercialProposal"("designerId");

-- CreateIndex
CREATE INDEX "CommercialProposal_status_idx" ON "CommercialProposal"("status");

-- CreateIndex
CREATE INDEX "CommercialProposal_nextTouchAt_idx" ON "CommercialProposal"("nextTouchAt");

-- CreateIndex
CREATE INDEX "CommercialProposal_sentAt_idx" ON "CommercialProposal"("sentAt");

-- CreateIndex
CREATE INDEX "CommercialProposal_createdAt_idx" ON "CommercialProposal"("createdAt");

-- CreateIndex
CREATE INDEX "CommercialProposal_updatedAt_idx" ON "CommercialProposal"("updatedAt");

-- CreateIndex
CREATE INDEX "CrmViolation_resolvedAt_idx" ON "CrmViolation"("resolvedAt");

-- CreateIndex
CREATE INDEX "CrmViolation_entityType_entityId_status_idx" ON "CrmViolation"("entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "CrmViolation_status_responsibleId_detectedAt_idx" ON "CrmViolation"("status", "responsibleId", "detectedAt");

-- CreateIndex
CREATE INDEX "CrmViolation_status_entityType_detectedAt_idx" ON "CrmViolation"("status", "entityType", "detectedAt");

-- CreateIndex
CREATE INDEX "CrmViolation_status_canAffectBonus_idx" ON "CrmViolation"("status", "canAffectBonus");

-- CreateIndex
CREATE INDEX "Deal_responsibleId_idx" ON "Deal"("responsibleId");

-- CreateIndex
CREATE INDEX "Deal_createdById_idx" ON "Deal"("createdById");

-- CreateIndex
CREATE INDEX "Deal_clientId_idx" ON "Deal"("clientId");

-- CreateIndex
CREATE INDEX "Deal_objectId_idx" ON "Deal"("objectId");

-- CreateIndex
CREATE INDEX "Deal_designerId_idx" ON "Deal"("designerId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_source_idx" ON "Deal"("source");

-- CreateIndex
CREATE INDEX "Deal_probability_idx" ON "Deal"("probability");

-- CreateIndex
CREATE INDEX "Deal_nextActionAt_idx" ON "Deal"("nextActionAt");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_updatedAt_idx" ON "Deal"("updatedAt");

-- CreateIndex
CREATE INDEX "Designer_responsibleId_idx" ON "Designer"("responsibleId");

-- CreateIndex
CREATE INDEX "Designer_createdById_idx" ON "Designer"("createdById");

-- CreateIndex
CREATE INDEX "Designer_relationshipStage_idx" ON "Designer"("relationshipStage");

-- CreateIndex
CREATE INDEX "Designer_potential_idx" ON "Designer"("potential");

-- CreateIndex
CREATE INDEX "Designer_loyalty_idx" ON "Designer"("loyalty");

-- CreateIndex
CREATE INDEX "Designer_status_idx" ON "Designer"("status");

-- CreateIndex
CREATE INDEX "Designer_source_idx" ON "Designer"("source");

-- CreateIndex
CREATE INDEX "Designer_createdAt_idx" ON "Designer"("createdAt");

-- CreateIndex
CREATE INDEX "Designer_lastTouchAt_idx" ON "Designer"("lastTouchAt");

-- CreateIndex
CREATE INDEX "Designer_nextStepAt_idx" ON "Designer"("nextStepAt");

-- CreateIndex
CREATE INDEX "ProjectObject_responsibleId_idx" ON "ProjectObject"("responsibleId");

-- CreateIndex
CREATE INDEX "ProjectObject_createdById_idx" ON "ProjectObject"("createdById");

-- CreateIndex
CREATE INDEX "ProjectObject_clientId_idx" ON "ProjectObject"("clientId");

-- CreateIndex
CREATE INDEX "ProjectObject_designerId_idx" ON "ProjectObject"("designerId");

-- CreateIndex
CREATE INDEX "ProjectObject_stage_idx" ON "ProjectObject"("stage");

-- CreateIndex
CREATE INDEX "ProjectObject_status_idx" ON "ProjectObject"("status");

-- CreateIndex
CREATE INDEX "ProjectObject_objectType_idx" ON "ProjectObject"("objectType");

-- CreateIndex
CREATE INDEX "ProjectObject_createdAt_idx" ON "ProjectObject"("createdAt");
