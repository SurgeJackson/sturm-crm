import { prisma } from "@/lib/prisma";

export function getDesignerForMutation(id: string) {
  return prisma.designer.findUnique({ where: { id } });
}
