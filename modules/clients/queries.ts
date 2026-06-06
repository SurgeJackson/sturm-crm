import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clientAccessWhere } from "@/modules/crm/access-where";
import { userSummarySelect } from "@/modules/crm/selects";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity, getActiveViolationsMap } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

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

export async function getClients(params: ClientListSearchParams, user: PermissionUser) {
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const filters: Prisma.ClientWhereInput[] = [clientAccessWhere(user)];

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

  const [rows, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: userSummarySelect },
        createdBy: { select: userSummarySelect }
      }
    }),
    prisma.client.count({ where })
  ]);
  const violations = await getActiveViolationsMap("CLIENT", rows.map((item) => item.id));
  const items = rows.map((item) => {
    const crmViolations = violations.get(item.id) ?? [];
    return {
      ...item,
      crmViolations,
      bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations)
    };
  });

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
      responsible: { select: userSummarySelect },
      createdBy: { select: userSummarySelect },
      projectObjects: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          designer: { select: { id: true, name: true, studio: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          projectObject: { select: { id: true, title: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      proposals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          deal: { select: { id: true, title: true } },
          projectObject: { select: { id: true, title: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 30,
        include: taskInclude()
      }
    }
  });

  if (!client || !canViewRecord(user, client)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("CLIENT", client.id);
  return {
    ...client,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations)
  };
}
