import { prisma } from "@/lib/prisma";

export type TaskLinkInput = {
  clientId?: string;
  designerId?: string;
  objectId?: string;
  dealId?: string;
  proposalId?: string;
  objectParticipantId?: string;
};

export async function resolveTaskLinks(input: TaskLinkInput) {
  const links = { ...input };

  if (links.proposalId) {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: links.proposalId },
      select: { clientId: true, designerId: true, objectId: true, dealId: true }
    });
    if (proposal) {
      links.clientId ||= proposal.clientId;
      links.designerId ||= proposal.designerId ?? undefined;
      links.objectId ||= proposal.objectId;
      links.dealId ||= proposal.dealId;
    }
  }

  if (links.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: links.dealId },
      select: { clientId: true, designerId: true, objectId: true }
    });
    if (deal) {
      links.clientId ||= deal.clientId;
      links.designerId ||= deal.designerId ?? undefined;
      links.objectId ||= deal.objectId;
    }
  }

  if (links.objectParticipantId) {
    const participant = await prisma.projectObjectParticipant.findUnique({
      where: { id: links.objectParticipantId },
      include: { object: { select: { id: true, clientId: true, designerId: true } } }
    });
    if (participant) {
      links.objectId ||= participant.object.id;
      links.clientId ||= participant.object.clientId;
      links.designerId ||= participant.object.designerId ?? undefined;
    }
  }

  if (links.objectId) {
    const object = await prisma.projectObject.findUnique({
      where: { id: links.objectId },
      select: { clientId: true, designerId: true }
    });
    if (object) {
      links.clientId ||= object.clientId;
      links.designerId ||= object.designerId ?? undefined;
    }
  }

  return {
    clientId: links.clientId || null,
    designerId: links.designerId || null,
    objectId: links.objectId || null,
    dealId: links.dealId || null,
    proposalId: links.proposalId || null,
    objectParticipantId: links.objectParticipantId || null
  };
}
