import { prisma } from "@/lib/prisma";
import {
  clientAccessWhere,
  dealAccessWhere,
  designerAccessWhere,
  objectAccessWhere,
  objectParticipantAccessWhere,
  proposalAccessWhere
} from "@/modules/crm/access-where";
import { userSummarySelect } from "@/modules/crm/selects";
import type { PermissionUser } from "@/permissions";

export async function getTaskFormContext(user: PermissionUser) {
  const [users, clients, designers, objects, deals, proposals, participants] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: userSummarySelect }),
    prisma.client.findMany({ where: clientAccessWhere(user), orderBy: { name: "asc" }, select: { id: true, name: true, responsibleId: true } }),
    prisma.designer.findMany({ where: designerAccessWhere(user), orderBy: { name: "asc" }, select: { id: true, name: true, studio: true, responsibleId: true } }),
    prisma.projectObject.findMany({ where: objectAccessWhere(user), orderBy: { title: "asc" }, select: { id: true, title: true, clientId: true, designerId: true, responsibleId: true } }),
    prisma.deal.findMany({ where: dealAccessWhere(user), orderBy: { title: "asc" }, select: { id: true, title: true, clientId: true, objectId: true, designerId: true, responsibleId: true } }),
    prisma.commercialProposal.findMany({ where: proposalAccessWhere(user), orderBy: { createdAt: "desc" }, select: { id: true, proposalNumber: true, dealId: true, clientId: true, objectId: true, designerId: true, responsibleId: true } }),
    prisma.projectObjectParticipant.findMany({
      where: { AND: [objectParticipantAccessWhere(user), { archivedAt: null }] },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, objectId: true, responsibleId: true }
    })
  ]);

  return { users, clients, designers, objects, deals, proposals, participants };
}
