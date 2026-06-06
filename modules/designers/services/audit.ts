import type { Designer } from "@/generated/prisma/client";
import type { TrackedAuditField } from "@/modules/crm/audit-helpers";

export function designerTrackedFields(before: Designer, after: Designer): readonly TrackedAuditField[] {
  return [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["relationshipStage", "CHANGE_RELATIONSHIP_STAGE", before.relationshipStage, after.relationshipStage],
    ["potential", "CHANGE_POTENTIAL", before.potential, after.potential],
    ["loyalty", "CHANGE_LOYALTY", before.loyalty, after.loyalty],
    ["nextStepText", "CHANGE_NEXT_STEP", before.nextStepText, after.nextStepText],
    ["nextStepAt", "CHANGE_NEXT_STEP", before.nextStepAt?.toISOString?.(), after.nextStepAt?.toISOString?.()]
  ] as const;
}
