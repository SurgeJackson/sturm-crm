import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dealAccessWhere } from "@/modules/crm/access-where";
import { closedDealStages } from "@/modules/crm/domain-constants";
import { pageFromParam, paginatedResult } from "@/modules/crm/pagination";
import { clientNameSelect, designerNameSelect, objectTitleSelect, userSummarySelect } from "@/modules/crm/selects";
import { withCrmViolations } from "@/modules/crm/violation-enrichment";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

export type DealListSearchParams = {
  q?: string;
  stage?: string;
  responsibleId?: string;
  clientId?: string;
  objectId?: string;
  designerId?: string;
  source?: string;
  probability?: string;
  noNextAction?: string;
  overdueNextAction?: string;
  lost?: string;
  active?: string;
  noAmount?: string;
  highProbability?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;
export { dealAccessWhere };

export function activeDealWhere(): Prisma.DealWhereInput {
  return {
    archivedAt: null,
    stage: { notIn: closedDealStages }
  };
}

export async function getDeals(params: DealListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const now = new Date();
  const filters: Prisma.DealWhereInput[] = [dealAccessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { title: { contains: params.q, mode: "insensitive" } },
        { client: { name: { contains: params.q, mode: "insensitive" } } },
        { projectObject: { title: { contains: params.q, mode: "insensitive" } } }
      ]
    });
  }

  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.source) filters.push({ source: params.source as never });
  if (params.probability) filters.push({ probability: params.probability as never });
  if (params.noNextAction === "1") filters.push({ OR: [{ nextActionAt: null }, { nextActionText: null }] });
  if (params.overdueNextAction === "1") filters.push({ nextActionAt: { lt: now }, stage: { notIn: closedDealStages } });
  if (params.lost === "1") filters.push({ stage: "LOST" });
  if (params.active === "1") filters.push(activeDealWhere());
  if (params.noAmount === "1") filters.push({ potentialAmount: null });
  if (params.highProbability === "1") filters.push({ probability: { in: ["HIGH", "VERY_HIGH"] } });

  const where: Prisma.DealWhereInput = { AND: filters };
  const orderBy: Prisma.DealOrderByWithRelationInput =
    params.sort === "title"
      ? { title: "asc" }
      : params.sort === "nextActionAt"
        ? { nextActionAt: "asc" }
        : params.sort === "potentialAmount"
          ? { potentialAmount: "desc" }
          : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: dealListInclude()
    }),
    prisma.deal.count({ where })
  ]);
  const items = await withCrmViolations("DEAL", rows);
  return paginatedResult(items, total, page, PAGE_SIZE);
}

export function dealListInclude() {
  return {
    client: { select: clientNameSelect },
    projectObject: { select: { id: true, title: true, city: true } },
    designer: { select: designerNameSelect },
    responsible: { select: userSummarySelect }
  } satisfies Prisma.DealInclude;
}

export async function getDealForUser(id: string, user: PermissionUser) {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true } },
      projectObject: { select: { id: true, title: true, city: true, address: true } },
      designer: { select: designerNameSelect },
      responsible: { select: userSummarySelect },
      createdBy: { select: userSummarySelect },
      proposals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
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

  if (!deal || !canViewRecord(user, deal)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("DEAL", deal.id);
  return {
    ...deal,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations)
  };
}

export async function getDealPipeline(user: PermissionUser) {
  return prisma.deal.findMany({
    where: {
      ...dealAccessWhere(user),
      archivedAt: null
    },
    orderBy: [{ nextActionAt: "asc" }, { createdAt: "desc" }],
    include: dealListInclude()
  });
}
