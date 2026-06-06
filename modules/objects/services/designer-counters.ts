import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ObjectServiceClient = PrismaClient | Prisma.TransactionClient;

export async function refreshDesignerObjectCounters(designerId?: string | null, client: ObjectServiceClient = prisma) {
  if (!designerId) return;

  const [transferredObjectsCount, activeObjectsCount] = await Promise.all([
    client.projectObject.count({ where: { designerId, archivedAt: null } }),
    client.projectObject.count({ where: { designerId, archivedAt: null, status: "ACTIVE" } })
  ]);

  await client.designer.update({
    where: { id: designerId },
    data: { transferredObjectsCount, activeObjectsCount }
  });
}

export async function refreshDesignerCountersForChange(
  beforeDesignerId?: string | null,
  afterDesignerId?: string | null,
  client: ObjectServiceClient = prisma
) {
  const ids = Array.from(new Set([beforeDesignerId, afterDesignerId].filter(Boolean)));
  for (const id of ids) {
    await refreshDesignerObjectCounters(id, client);
  }
}
