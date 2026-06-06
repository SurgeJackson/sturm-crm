import type { TaskActivity } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function refreshTouchDates(task: TaskActivity) {
  if (task.recordType !== "TOUCH") return;
  const touchedAt = task.completedAt ?? task.dueAt ?? new Date();

  await Promise.all([
    task.clientId
      ? prisma.client.update({
          where: { id: task.clientId },
          data: { lastContactAt: touchedAt }
        })
      : null,
    task.designerId
      ? prisma.designer.update({
          where: { id: task.designerId },
          data: { lastTouchAt: touchedAt }
        })
      : null
  ]);
}
