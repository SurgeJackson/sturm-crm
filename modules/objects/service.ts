import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { daysFromNow } from "@/modules/crm/date-ranges";
import { toAuditValue } from "@/modules/crm/form-utils";

export async function refreshDesignerObjectCounters(designerId?: string | null) {
  if (!designerId) return;

  const [transferredObjectsCount, activeObjectsCount] = await Promise.all([
    prisma.projectObject.count({ where: { designerId, archivedAt: null } }),
    prisma.projectObject.count({ where: { designerId, archivedAt: null, status: "ACTIVE" } })
  ]);

  await prisma.designer.update({
    where: { id: designerId },
    data: { transferredObjectsCount, activeObjectsCount }
  });
}

export async function refreshDesignerCountersForChange(beforeDesignerId?: string | null, afterDesignerId?: string | null) {
  const ids = Array.from(new Set([beforeDesignerId, afterDesignerId].filter(Boolean)));
  for (const id of ids) {
    await refreshDesignerObjectCounters(id);
  }
}

export async function createFrozenObjectReturnTask(object: {
  id: string;
  title: string;
  clientId: string;
  designerId: string | null;
  responsibleId: string;
}, userId: string) {
  const existing = await prisma.taskActivity.findFirst({
    where: {
      objectId: object.id,
      autoRule: "FROZEN_OBJECT_RETURN",
      archivedAt: null,
      status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }
    },
    select: { id: true }
  });
  if (existing) return;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Вернуться к объекту ${object.title}`,
      description: "Автоматическая задача после заморозки объекта",
      responsibleId: object.responsibleId,
      createdById: userId,
      clientId: object.clientId,
      designerId: object.designerId,
      objectId: object.id,
      status: "NEW",
      priority: "NORMAL",
      dueAt: daysFromNow(30),
      isAutoCreated: true,
      autoRule: "FROZEN_OBJECT_RETURN"
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_AUTO",
    userId,
    after: toAuditValue(task)
  });
}
