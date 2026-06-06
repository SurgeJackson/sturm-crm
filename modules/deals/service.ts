import { prisma } from "@/lib/prisma";

export function getObjectForDeal(objectId: string) {
  return prisma.projectObject.findUnique({
    where: { id: objectId },
    select: { id: true, clientId: true, designerId: true }
  });
}
