import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";

export async function ignoreCrmViolation(id: string, userId: string) {
  const before = await prisma.crmViolation.findUnique({ where: { id } });
  if (!before) return null;

  const after = await prisma.crmViolation.update({
    where: { id },
    data: {
      status: "IGNORED",
      resolvedAt: new Date(),
      resolvedById: userId,
      comment: "Проигнорировано руководителем"
    }
  });

  await writeEntityAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: id,
    action: "IGNORE_CRM_VIOLATION",
    userId,
    before,
    after
  });

  return after;
}
