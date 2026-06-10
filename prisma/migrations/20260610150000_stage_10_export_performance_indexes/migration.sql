-- Optimizes Stage 10 schedule/timesheet matrix exports and monthly table views.
CREATE INDEX IF NOT EXISTS "TimeEvent_locationId_occurredAt_idx" ON "TimeEvent"("locationId", "occurredAt");
CREATE INDEX IF NOT EXISTS "TimesheetDay_locationId_date_idx" ON "TimesheetDay"("locationId", "date");
CREATE INDEX IF NOT EXISTS "TimeAdjustmentRequest_employeeId_date_idx" ON "TimeAdjustmentRequest"("employeeId", "date");
