import { prisma } from "@/lib/prisma";

export async function getUserHandover(id: string) {
  const [user, users, counts] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, isActive: true, deactivatedAt: true } }),
    prisma.user.findMany({
      where: { id: { not: id }, isActive: true, deactivatedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    }),
    Promise.all([
      prisma.client.count({ where: { responsibleId: id, archivedAt: null } }),
      prisma.designer.count({ where: { responsibleId: id, archivedAt: null } }),
      prisma.projectObject.count({ where: { responsibleId: id, archivedAt: null } }),
      prisma.deal.count({ where: { responsibleId: id, archivedAt: null } }),
      prisma.commercialProposal.count({ where: { responsibleId: id, archivedAt: null } }),
      prisma.taskActivity.count({ where: { responsibleId: id, archivedAt: null } })
    ])
  ]);

  if (!user) return null;

  return {
    user,
    users,
    counts: {
      clients: counts[0],
      designers: counts[1],
      objects: counts[2],
      deals: counts[3],
      proposals: counts[4],
      tasks: counts[5]
    }
  };
}
