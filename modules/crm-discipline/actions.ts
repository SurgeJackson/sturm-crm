"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { canIgnoreCrmViolation } from "@/permissions";

export async function ignoreCrmViolationAction(id: string, returnTo: string) {
  const user = await getCurrentUser();
  if (!user || !canIgnoreCrmViolation(user)) {
    redirect(`${returnTo}?error=disciplinePermission`);
  }

  const before = await prisma.crmViolation.findUnique({ where: { id } });
  if (!before) redirect(returnTo);

  const after = await prisma.crmViolation.update({
    where: { id },
    data: {
      status: "IGNORED",
      resolvedAt: new Date(),
      resolvedById: user.id,
      comment: "Проигнорировано руководителем"
    }
  });

  await writeEntityAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: id,
    action: "IGNORE_CRM_VIOLATION",
    userId: user.id,
    before,
    after
  });

  redirect(`${returnTo}?disciplineIgnored=1`);
}
