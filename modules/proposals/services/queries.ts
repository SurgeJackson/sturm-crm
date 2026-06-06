import { prisma } from "@/lib/prisma";

export async function getDealForProposal(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      clientId: true,
      objectId: true,
      designerId: true,
      responsibleId: true
    }
  });
}

export function getProposalForMutation(id: string) {
  return prisma.commercialProposal.findUnique({ where: { id } });
}

export function getProposalWithDealForMutation(id: string) {
  return prisma.commercialProposal.findUnique({
    where: { id },
    include: { deal: true }
  });
}
