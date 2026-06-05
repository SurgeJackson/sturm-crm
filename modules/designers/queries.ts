import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewAllData, canViewRecord, type PermissionUser } from "@/permissions";

export type DesignerListSearchParams = {
  q?: string;
  role?: string;
  relationshipStage?: string;
  potential?: string;
  loyalty?: string;
  responsibleId?: string;
  noNextStep?: string;
  noTouch60?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;

function accessWhere(user: PermissionUser): Prisma.DesignerWhereInput {
  if (canViewAllData(user)) return {};

  return {
    OR: [{ responsibleId: user.id }, { createdById: user.id }]
  };
}

export async function getDesigners(params: DesignerListSearchParams, user: PermissionUser) {
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const filters: Prisma.DesignerWhereInput[] = [accessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { studio: { contains: params.q, mode: "insensitive" } },
        { phone: { contains: params.q } },
        { email: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }

  if (params.role) filters.push({ role: params.role as never });
  if (params.relationshipStage) filters.push({ relationshipStage: params.relationshipStage as never });
  if (params.potential) filters.push({ potential: params.potential as never });
  if (params.loyalty) filters.push({ loyalty: params.loyalty as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.noNextStep === "1") {
    filters.push({ OR: [{ nextStepAt: null }, { nextStepText: null }] });
  }
  if (params.noTouch60 === "1") {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 60);
    filters.push({ OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: threshold } }] });
  }

  const where: Prisma.DesignerWhereInput = { AND: filters };

  const orderBy: Prisma.DesignerOrderByWithRelationInput =
    params.sort === "name"
      ? { name: "asc" }
      : params.sort === "nextStepAt"
        ? { nextStepAt: "asc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.designer.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.designer.count({ where })
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  };
}

export async function getDesignerForUser(id: string, user: PermissionUser) {
  const designer = await prisma.designer.findUnique({
    where: { id },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  if (!designer || !canViewRecord(user, designer)) {
    notFound();
  }

  return designer;
}

export async function getDesignerPipeline(user: PermissionUser) {
  const designers = await prisma.designer.findMany({
    where: {
      ...accessWhere(user),
      archivedAt: null
    },
    orderBy: [{ nextStepAt: "asc" }, { createdAt: "desc" }],
    include: {
      responsible: { select: { id: true, name: true, email: true } }
    }
  });

  return designers;
}
