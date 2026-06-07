import type { AuditEntityType } from "@/generated/prisma/client";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { prisma } from "@/lib/prisma";

const MASS_VIEW_LIMIT = 100;
const MASS_VIEW_WINDOW_MS = 30 * 60 * 1000;

export async function recordEntityView(userId: string, entityType: AuditEntityType, entityId: string) {
  const context = await getRequestContext();
  await writeSecurityLog({
    action: "ENTITY_VIEWED",
    userId,
    entityType,
    entityId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  const since = new Date(Date.now() - MASS_VIEW_WINDOW_MS);
  const views = await prisma.securityLog.count({
    where: {
      userId,
      entityType,
      action: "ENTITY_VIEWED",
      createdAt: { gte: since }
    }
  });

  if (views > MASS_VIEW_LIMIT) {
    await writeSecurityLog({
      action: "MASS_VIEW_DETECTED",
      userId,
      entityType: "USER",
      entityId: userId,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { rule: "entity_views_per_30_minutes", viewedEntityType: entityType, views }
    });
  }
}
