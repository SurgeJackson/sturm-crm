import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewAllData, canViewRecord, type PermissionUser } from "@/permissions";

export type ClientListSearchParams = {
  q?: string;
  clientType?: string;
  source?: string;
  status?: string;
  responsibleId?: string;
  noNextContact?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;

function accessWhere(user: PermissionUser): Prisma.ClientWhereInput {
  if (canViewAllData(user)) return {};

  return {
    OR: [{ responsibleId: user.id }, { createdById: user.id }]
  };
}

export async function getClients(params: ClientListSearchParams, user: PermissionUser) {
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const filters: Prisma.ClientWhereInput[] = [accessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q } },
      { email: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }

  if (params.clientType) filters.push({ clientType: params.clientType as never });
  if (params.source) filters.push({ source: params.source as never });
  if (params.status) filters.push({ status: params.status as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.noNextContact === "1") filters.push({ nextContactAt: null });

  const where: Prisma.ClientWhereInput = { AND: filters };

  const orderBy: Prisma.ClientOrderByWithRelationInput =
    params.sort === "name"
      ? { name: "asc" }
      : params.sort === "nextContactAt"
        ? { nextContactAt: "asc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.client.count({ where })
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  };
}

export async function getClientForUser(id: string, user: PermissionUser) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  if (!client || !canViewRecord(user, client)) {
    notFound();
  }

  return client;
}
