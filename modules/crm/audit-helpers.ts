import type { AuditEntityType, Prisma, PrismaClient } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { toAuditValue } from "@/modules/crm/form-utils";

type AuditLogClient = PrismaClient | Prisma.TransactionClient;

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
  fields,
  client
}: {
  entityType: AuditEntityType;
  entityId: string;
  userId: string;
  fields: readonly TrackedAuditField[];
  client?: AuditLogClient;
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
      }, client);
    }
  }
}

export async function writeEntityAuditLog({
  entityType,
  entityId,
  action,
  userId,
  before,
  after,
  client
}: {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  userId: string;
  before?: unknown;
  after?: unknown;
  client?: AuditLogClient;
}) {
  return writeAuditLog({
    entityType,
    entityId,
    action,
    userId,
    before: before === undefined ? undefined : toAuditValue(before),
    after: after === undefined ? undefined : toAuditValue(after)
  }, client);
}
