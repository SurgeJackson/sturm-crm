import { daysFromNow } from "@/modules/crm/date-ranges";
import { createAutomaticTask } from "@/modules/tasks/service";

export async function createFrozenObjectReturnTask(object: {
  id: string;
  title: string;
  clientId: string;
  designerId: string | null;
  responsibleId: string;
}, userId: string) {
  return createAutomaticTask({
    title: `Вернуться к объекту ${object.title}`,
    description: "Автоматическая задача после заморозки объекта",
    responsibleId: object.responsibleId,
    createdById: userId,
    dueAt: daysFromNow(30),
    autoRule: "FROZEN_OBJECT_RETURN",
    clientId: object.clientId,
    designerId: object.designerId,
    objectId: object.id
  });
}
