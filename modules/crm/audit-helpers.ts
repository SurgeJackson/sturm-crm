import type { AuditEntityType } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";

export type TrackedAuditField = readonly [
  field: string,
  action: string,
  previous: unknown,
  next: unknown
];

export async function writeTrackedFieldAuditLogs({
  entityType,
  entityId,
  userId,
  fields
}: {
  entityType: AuditEntityType;
  entityId: string;
  userId: string;
  fields: readonly TrackedAuditField[];
}) {
  for (const [field, action, previous, next] of fields) {
    if (previous !== next) {
      await writeAuditLog({
        entityType,
        entityId,
        action,
        userId,
        before: { [field]: previous },
        after: { [field]: next }
      });
    }
  }
}
