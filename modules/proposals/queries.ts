import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { commercialProposalStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { proposalAccessWhere } from "@/modules/crm/access-where";
import { daysAgo } from "@/modules/crm/date-ranges";
import { closedProposalStatuses } from "@/modules/crm/domain-constants";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { clientNameSelect, dealTitleSelect, designerNameSelect, objectTitleSelect, userSummarySelect } from "@/modules/crm/selects";
import { withCrmViolations } from "@/modules/crm/violation-enrichment";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

export type ProposalListSearchParams = {
  q?: string;
  status?: string;
  responsibleId?: string;
  clientId?: string;
  objectId?: string;
  dealId?: string;
  designerId?: string;
  noFile?: string;
  noFollowUp?: string;
  overdueFollowUp?: string;
  thinking7?: string;
  internalReview?: string;
  needsRecalculation?: string;
  accepted?: string;
  declined?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;
export { proposalAccessWhere };

export function proposalListInclude() {
  return {
    deal: { select: dealTitleSelect },
    client: { select: clientNameSelect },
    projectObject: { select: objectTitleSelect },
    designer: { select: designerNameSelect },
    responsible: { select: userSummarySelect }
  } satisfies Prisma.CommercialProposalInclude;
}

export async function getProposals(params: ProposalListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const now = new Date();
  const thinkingThreshold = daysAgo(7, now);
  const filters: Prisma.CommercialProposalWhereInput[] = [proposalAccessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { proposalNumber: { contains: params.q, mode: "insensitive" } },
        { client: { name: { contains: params.q, mode: "insensitive" } } },
        { projectObject: { title: { contains: params.q, mode: "insensitive" } } },
        { deal: { title: { contains: params.q, mode: "insensitive" } } }
      ]
    });
  }

  const status = enumParam(params.status, commercialProposalStatusLabels);
  if (status) filters.push({ status });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.dealId) filters.push({ dealId: params.dealId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (flagParam(params.noFile)) filters.push({ fileUrl: null });
  if (flagParam(params.noFollowUp)) filters.push({ nextTouchAt: null });
  if (flagParam(params.overdueFollowUp)) {
    filters.push({ nextTouchAt: { lt: now }, status: { notIn: closedProposalStatuses } });
  }
  if (flagParam(params.thinking7)) filters.push({ status: "CLIENT_THINKING", sentAt: { lt: thinkingThreshold } });
  if (flagParam(params.internalReview)) filters.push({ status: "INTERNAL_REVIEW" });
  if (flagParam(params.needsRecalculation)) filters.push({ status: "NEEDS_RECALCULATION" });
  if (flagParam(params.accepted)) filters.push({ status: "ACCEPTED" });
  if (flagParam(params.declined)) filters.push({ status: "DECLINED" });

  const where: Prisma.CommercialProposalWhereInput = { AND: filters };
  const orderBy = sortFromParam<Prisma.CommercialProposalOrderByWithRelationInput>(params.sort, {
    proposalNumber: { proposalNumber: "asc" },
    amount: { amount: "desc" },
    nextTouchAt: { nextTouchAt: "asc" }
  }, { createdAt: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.commercialProposal.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: proposalListInclude()
    }),
    countRows: () => prisma.commercialProposal.count({ where }),
    mapRows: (rows) => withCrmViolations("PROPOSAL", rows)
  });
}

export async function getProposalForUser(id: string, user: PermissionUser) {
  const proposal = await prisma.commercialProposal.findUnique({
    where: { id },
    include: {
      deal: { select: { id: true, title: true, stage: true } },
      client: { select: { id: true, name: true, phone: true, email: true } },
      projectObject: { select: { id: true, title: true, city: true, address: true } },
      designer: { select: designerNameSelect },
      responsible: { select: userSummarySelect },
      createdBy: { select: userSummarySelect },
      uploadedBy: { select: userSummarySelect },
      parent: {
        include: proposalListInclude()
      },
      versions: {
        where: { archivedAt: null },
        orderBy: { version: "asc" },
        include: proposalListInclude()
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: 30,
        include: taskInclude()
      }
    }
  });

  if (!proposal || !canViewRecord(user, proposal)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("PROPOSAL", proposal.id);
  return {
    ...proposal,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations)
  };
}

export async function getProposalVersionGroup(proposalId: string) {
  const proposal = await prisma.commercialProposal.findUnique({
    where: { id: proposalId },
    select: { id: true, parentProposalId: true }
  });

  if (!proposal) return [];

  const rootId = proposal.parentProposalId ?? proposal.id;
  return prisma.commercialProposal.findMany({
    where: { OR: [{ id: rootId }, { parentProposalId: rootId }], archivedAt: null },
    orderBy: { version: "asc" },
    include: proposalListInclude()
  });
}
