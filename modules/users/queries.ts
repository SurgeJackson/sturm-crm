import { prisma } from "@/lib/prisma";

export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
}
