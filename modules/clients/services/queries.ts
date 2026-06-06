import { prisma } from "@/lib/prisma";

export function getClientForMutation(id: string) {
  return prisma.client.findUnique({ where: { id } });
}
