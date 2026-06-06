import type { Deal } from "@/generated/prisma/client";
import type { TrackedAuditField } from "@/modules/crm/audit-helpers";

export function dealTrackedFields(before: Deal, after: Deal): readonly TrackedAuditField[] {
  return [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["stage", "CHANGE_STAGE", before.stage, after.stage],
    ["potentialAmount", "CHANGE_AMOUNT", before.potentialAmount, after.potentialAmount],
    ["probability", "CHANGE_PROBABILITY", before.probability, after.probability],
    ["nextActionText", "CHANGE_NEXT_ACTION", before.nextActionText, after.nextActionText],
    ["nextActionAt", "CHANGE_NEXT_ACTION", before.nextActionAt?.toISOString?.(), after.nextActionAt?.toISOString?.()],
    ["lossReason", "SET_LOSS_REASON", before.lossReason, after.lossReason]
  ] as const;
}

export function dealStatusAuditEvents(before: Pick<Deal, "stage">, after: Pick<Deal, "stage" | "lossReason">) {
  return [
    ...(before.stage !== "LOST" && after.stage === "LOST"
      ? [{
          action: "MARK_LOST",
          before: { stage: before.stage },
          after: { stage: after.stage, lossReason: after.lossReason }
        }]
      : []),
    ...(before.stage !== "COMPLETED" && after.stage === "COMPLETED"
      ? [{
          action: "MARK_COMPLETED",
          before: { stage: before.stage },
          after: { stage: after.stage }
        }]
      : [])
  ];
}
