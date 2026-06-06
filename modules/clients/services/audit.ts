import type { Client } from "@/generated/prisma/client";
import type { TrackedAuditField } from "@/modules/crm/audit-helpers";

export function clientTrackedFields(before: Client, after: Pick<Client, "responsibleId" | "status">): readonly TrackedAuditField[] {
  return [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["status", "CHANGE_STATUS", before.status, after.status]
  ] as const;
}
