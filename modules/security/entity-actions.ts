"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { archiveEntity, entityPath, getArchivableEntity, restoreEntity, type ArchivableEntityType } from "@/modules/security/entity-archive";
import { canArchiveEntity, canHardDelete, canRestoreEntity } from "@/permissions";

export async function archiveEntityAction(type: ArchivableEntityType, id: string) {
  const user = await getCurrentUser();
  const context = await getRequestContext();
  const path = entityPath(type, id);
  if (!user) redirect("/auth/login");

  const entity = await getArchivableEntity(type, id);
  if (!entity || !canArchiveEntity(user, entity)) {
    await writeSecurityLog({
      action: "PERMISSION_DENIED",
      userId: user.id,
      entityType: type,
      entityId: id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { operation: "archive" }
    });
    redirect(`${path}?error=archive`);
  }

  await archiveEntity(type, id, user.id, context);
  redirect(`${path}?archived=1`);
}

export async function restoreEntityAction(type: ArchivableEntityType, id: string) {
  const user = await getCurrentUser();
  const context = await getRequestContext();
  const path = entityPath(type, id);
  if (!user) redirect("/auth/login");

  const entity = await getArchivableEntity(type, id);
  if (!entity || !canRestoreEntity(user, entity)) {
    await writeSecurityLog({
      action: "PERMISSION_DENIED",
      userId: user.id,
      entityType: type,
      entityId: id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { operation: "restore" }
    });
    redirect(`${path}?error=restore`);
  }

  await restoreEntity(type, id, user.id, context);
  redirect(`${path}?restored=1`);
}

export async function hardDeleteAttemptAction(type: ArchivableEntityType, id: string) {
  const user = await getCurrentUser();
  const context = await getRequestContext();
  const path = entityPath(type, id);
  if (!user) redirect("/auth/login");

  await writeSecurityLog({
    action: "HARD_DELETE_ATTEMPT",
    userId: user.id,
    entityType: type,
    entityId: id,
    severity: canHardDelete(user) ? "CRITICAL" : "WARNING",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { allowed: canHardDelete(user) }
  });
  redirect(`${path}?error=hardDelete`);
}
