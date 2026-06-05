"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { toAuditValue } from "@/modules/crm/form-utils";
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

  await writeAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: id,
    action: "IGNORE_CRM_VIOLATION",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  redirect(`${returnTo}?disciplineIgnored=1`);
}
