import { prisma } from "@/lib/prisma";

export function getObjectForDeal(objectId: string) {
  return prisma.projectObject.findUnique({
    where: { id: objectId },
    select: { id: true, clientId: true, designerId: true }
  });
}

export function getDealForMutation(id: string) {
  return prisma.deal.findUnique({ where: { id } });
}
