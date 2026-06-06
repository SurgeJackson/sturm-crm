-- Prevent duplicate active violations for the same entity and rule while
-- preserving history for resolved, ignored and expired violations.
CREATE UNIQUE INDEX "CrmViolation_active_unique"
  ON "CrmViolation"("entityType", "entityId", "violationCode")
  WHERE "status" = 'ACTIVE';
