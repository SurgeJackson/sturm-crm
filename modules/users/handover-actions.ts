"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";
import { writeAuditLog } from "@/lib/audit-log";
import { writeSecurityLog } from "@/lib/security-log";
import { canDeactivateUser } from "@/permissions";

export async function handoverUserAction(id: string, formData: FormData) {
  const actor = await getCurrentUser();
  const context = await getRequestContext();
  if (!actor || !canDeactivateUser(actor)) redirect("/");

  const targetUserId = String(formData.get("targetUserId") ?? "");
  if (!targetUserId || targetUserId === id) redirect(`/settings/users/${id}/handover?error=target`);

  const source = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!source) redirect(`/settings/users/${id}/handover?error=source`);

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, isActive: true, deactivatedAt: true } });
  if (!target?.isActive || target.deactivatedAt) redirect(`/settings/users/${id}/handover?error=target`);

  const result = await prisma.$transaction(async (tx) => {
    const [clients, designers, objects, deals, proposals, tasks] = await Promise.all([
      tx.client.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } }),
      tx.designer.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } }),
      tx.projectObject.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } }),
      tx.deal.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } }),
      tx.commercialProposal.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } }),
      tx.taskActivity.updateMany({ where: { responsibleId: id, archivedAt: null }, data: { responsibleId: targetUserId } })
    ]);
    return {
      clients: clients.count,
      designers: designers.count,
      objects: objects.count,
      deals: deals.count,
      proposals: proposals.count,
      tasks: tasks.count
    };
  });

  await writeAuditLog({
    entityType: "USER",
    entityId: id,
    action: "HANDOVER_RESPONSIBILITY",
    userId: actor.id,
    after: { fromUserId: id, toUserId: targetUserId, counts: result }
  });
  await writeSecurityLog({
    action: "USER_HANDOVER_COMPLETED",
    userId: actor.id,
    entityType: "USER",
    entityId: id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { fromUserId: id, toUserId: targetUserId, counts: result }
  });

  redirect(`/settings/users/${id}?handover=1`);
}
