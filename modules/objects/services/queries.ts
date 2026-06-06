import { prisma } from "@/lib/prisma";
import type { ObjectFormData } from "@/modules/objects/form";

export function getProjectObjectForMutation(id: string) {
  return prisma.projectObject.findUnique({ where: { id } });
}

export function getProjectObjectWithDesignerForMutation(id: string) {
  return prisma.projectObject.findUnique({
    where: { id },
    include: { designer: true }
  });
}

export async function validateObjectRelations(data: Pick<ObjectFormData, "clientId" | "designerId">) {
  const [client, designer] = await Promise.all([
    prisma.client.findUnique({ where: { id: data.clientId }, select: { id: true } }),
    data.designerId
      ? prisma.designer.findUnique({ where: { id: data.designerId }, select: { id: true } })
      : null
  ]);

  if (!client) return { ok: false as const, message: "Укажите клиента или заказчика объекта" };
  if (data.designerId && !designer) return { ok: false as const, message: "Выбранный дизайнер не найден" };
  return { ok: true as const };
}
