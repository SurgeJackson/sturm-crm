import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { clientSourceLabels, clientStatusLabels, clientTypeLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { clientAccessWhere } from "@/modules/crm/access-where";
import { DETAIL_TASK_LIMIT } from "@/modules/crm/detail-limits";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { userSummarySelect } from "@/modules/crm/selects";
import { withCrmViolations } from "@/modules/crm/violation-enrichment";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity } from "@/modules/crm-discipline/service";
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
  const page = pageFromParam(params.page);
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

  const clientType = enumParam(params.clientType, clientTypeLabels);
  const source = enumParam(params.source, clientSourceLabels);
  const status = enumParam(params.status, clientStatusLabels);
  if (clientType) filters.push({ clientType });
  if (source) filters.push({ source });
  if (status) filters.push({ status });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (flagParam(params.noNextContact)) filters.push({ nextContactAt: null });

  const where: Prisma.ClientWhereInput = { AND: filters };

  const orderBy = sortFromParam<Prisma.ClientOrderByWithRelationInput>(params.sort, {
    name: { name: "asc" },
    nextContactAt: { nextContactAt: "asc" }
  }, { createdAt: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: userSummarySelect },
        createdBy: { select: userSummarySelect }
      }
    }),
    countRows: () => prisma.client.count({ where }),
    mapRows: (rows) => withCrmViolations("CLIENT", rows)
  });
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
        take: DETAIL_TASK_LIMIT,
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
