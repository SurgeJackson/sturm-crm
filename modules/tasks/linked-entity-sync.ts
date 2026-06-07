import type { TaskActivity } from "@/generated/prisma/client";
import { syncClientDiscipline, syncDesignerDiscipline, syncTaskDiscipline } from "@/modules/crm-discipline/entity-sync";

export async function syncTaskAndLinkedEntities(task: TaskActivity, userId: string) {
  await syncTaskDiscipline(task.id, userId);
  if (task.clientId) await syncClientDiscipline(task.clientId, userId);
  if (task.designerId) await syncDesignerDiscipline(task.designerId, userId);
}
