import type { CommercialProposal } from "@/generated/prisma/client";
import type { TrackedAuditField } from "@/modules/crm/audit-helpers";

export function proposalTrackedFields(before: CommercialProposal, after: CommercialProposal): readonly TrackedAuditField[] {
  return [
    ["status", "CHANGE_STATUS", before.status, after.status],
    ["amount", "CHANGE_AMOUNT", before.amount, after.amount],
    ["discountPercent", "CHANGE_DISCOUNT", before.discountPercent, after.discountPercent],
    ["discountAmount", "CHANGE_DISCOUNT", before.discountAmount, after.discountAmount],
    ["nextTouchAt", "CHANGE_NEXT_TOUCH", before.nextTouchAt?.toISOString?.(), after.nextTouchAt?.toISOString?.()],
    ["declineReason", "DECLINE", before.declineReason, after.declineReason]
  ] as const;
}

export function proposalStatusAuditEvents(before: Pick<CommercialProposal, "status">, after: Pick<CommercialProposal, "status">) {
  return before.status !== "ACCEPTED" && after.status === "ACCEPTED"
    ? [{
        action: "ACCEPT",
        before: { status: before.status },
        after: { status: after.status }
      }]
    : [];
}
