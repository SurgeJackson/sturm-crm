import type { AuditEntityType, SecurityLogSeverity } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { RequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";

type SecurityEventLimit = {
  userId: string;
  eventAction: string;
  limit: number;
  since: Date;
  deniedAction: string;
  entityType?: AuditEntityType;
  entityId?: string;
  severity?: SecurityLogSeverity;
  context?: RequestContext;
  metadata?: Record<string, unknown>;
};

export async function securityEventCount(userId: string, actions: string[], since: Date) {
  return prisma.securityLog.count({
    where: {
      userId,
      action: { in: actions },
      createdAt: { gte: since }
    }
  });
}

export async function enforceSecurityEventLimit({
  userId,
  eventAction,
  limit,
  since,
  deniedAction,
  entityType = "USER",
  entityId = userId,
  severity = "WARNING",
  context = {},
  metadata = {}
}: SecurityEventLimit) {
  const count = await securityEventCount(userId, [eventAction], since);
  if (count < limit) return { allowed: true as const, count };

  await writeSecurityLog({
    action: deniedAction,
    userId,
    entityType,
    entityId,
    severity,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      ...metadata,
      rule: "security_event_rate_limit",
      eventAction,
      limit,
      count,
      since: since.toISOString()
    }
  });

  return { allowed: false as const, count };
}
