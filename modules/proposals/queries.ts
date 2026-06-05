import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewAllData, canViewRecord, type PermissionUser } from "@/permissions";

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

export function proposalAccessWhere(user: PermissionUser): Prisma.CommercialProposalWhereInput {
  if (canViewAllData(user)) return {};

  return {
    OR: [{ responsibleId: user.id }, { createdById: user.id }]
  };
}

export function proposalListInclude() {
  return {
    deal: { select: { id: true, title: true } },
    client: { select: { id: true, name: true } },
    projectObject: { select: { id: true, title: true } },
    designer: { select: { id: true, name: true, studio: true } },
    responsible: { select: { id: true, name: true, email: true } }
  } satisfies Prisma.CommercialProposalInclude;
}

export async function getProposals(params: ProposalListSearchParams, user: PermissionUser) {
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const now = new Date();
  const thinkingThreshold = new Date();
  thinkingThreshold.setDate(thinkingThreshold.getDate() - 7);
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

  if (params.status) filters.push({ status: params.status as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.dealId) filters.push({ dealId: params.dealId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.noFile === "1") filters.push({ fileUrl: null });
  if (params.noFollowUp === "1") filters.push({ nextTouchAt: null });
  if (params.overdueFollowUp === "1") {
    filters.push({ nextTouchAt: { lt: now }, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } });
  }
  if (params.thinking7 === "1") filters.push({ status: "CLIENT_THINKING", sentAt: { lt: thinkingThreshold } });
  if (params.internalReview === "1") filters.push({ status: "INTERNAL_REVIEW" });
  if (params.needsRecalculation === "1") filters.push({ status: "NEEDS_RECALCULATION" });
  if (params.accepted === "1") filters.push({ status: "ACCEPTED" });
  if (params.declined === "1") filters.push({ status: "DECLINED" });

  const where: Prisma.CommercialProposalWhereInput = { AND: filters };
  const orderBy: Prisma.CommercialProposalOrderByWithRelationInput =
    params.sort === "proposalNumber"
      ? { proposalNumber: "asc" }
      : params.sort === "amount"
        ? { amount: "desc" }
        : params.sort === "nextTouchAt"
          ? { nextTouchAt: "asc" }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.commercialProposal.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: proposalListInclude()
    }),
    prisma.commercialProposal.count({ where })
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  };
}

export async function getProposalForUser(id: string, user: PermissionUser) {
  const proposal = await prisma.commercialProposal.findUnique({
    where: { id },
    include: {
      deal: { select: { id: true, title: true, stage: true } },
      client: { select: { id: true, name: true, phone: true, email: true } },
      projectObject: { select: { id: true, title: true, city: true, address: true } },
      designer: { select: { id: true, name: true, studio: true } },
      responsible: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
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
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { responsible: { select: { id: true, name: true } } }
      }
    }
  });

  if (!proposal || !canViewRecord(user, proposal)) {
    notFound();
  }

  return proposal;
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
