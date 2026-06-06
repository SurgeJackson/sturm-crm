CREATE INDEX "TaskActivity_responsibleId_recordType_createdAt_idx" ON "TaskActivity"("responsibleId", "recordType", "createdAt");
CREATE INDEX "TaskActivity_responsibleId_status_completedAt_idx" ON "TaskActivity"("responsibleId", "status", "completedAt");
CREATE INDEX "TaskActivity_responsibleId_actionType_createdAt_idx" ON "TaskActivity"("responsibleId", "actionType", "createdAt");
CREATE INDEX "TaskActivity_responsibleId_recordType_completedAt_idx" ON "TaskActivity"("responsibleId", "recordType", "completedAt");
