import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";
import { taskInclude } from "@/modules/tasks/query-shared";

export async function getTaskForUser(id: string, user: PermissionUser) {
  const task = await prisma.taskActivity.findUnique({
    where: { id },
    include: taskInclude()
  });

  if (!task || !canViewRecord(user, task)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("TASK", task.id);
  return {
    ...task,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
  };
}
