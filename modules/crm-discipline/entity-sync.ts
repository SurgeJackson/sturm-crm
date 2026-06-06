import { prisma } from "@/lib/prisma";
import {
  validateClientForDiscipline,
  validateDealForDiscipline,
  validateDesignerForDiscipline,
  validateObjectForDiscipline,
  validateProposalForDiscipline,
  validateTaskForDiscipline
} from "@/modules/crm-discipline/rules";
import {
  expireViolationsForEntity,
  syncViolationsForEntity,
  type CrmDisciplineSyncOptions
} from "@/modules/crm-discipline/violation-sync";

export async function syncClientDiscipline(clientId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { created: 0, resolved: 0, active: 0 };
  if (client.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("CLIENT", client.id, actorId), active: 0 };
  return syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client, options), actorId);
}

export async function syncDesignerDiscipline(designerId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const designer = await prisma.designer.findUnique({ where: { id: designerId } });
  if (!designer) return { created: 0, resolved: 0, active: 0 };
  if (designer.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DESIGNER", designer.id, actorId), active: 0 };
  return syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer, options), actorId);
}

export async function syncObjectDiscipline(objectId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const object = await prisma.projectObject.findUnique({
    where: { id: objectId },
    include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } }
  });
  if (!object) return { created: 0, resolved: 0, active: 0 };
  if (object.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("OBJECT", object.id, actorId), active: 0 };
  return syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object, options), actorId);
}

export async function syncDealDiscipline(dealId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { created: 0, resolved: 0, active: 0 };
  if (deal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DEAL", deal.id, actorId), active: 0 };
  return syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal, options), actorId);
}

export async function syncProposalDiscipline(proposalId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const proposal = await prisma.commercialProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { created: 0, resolved: 0, active: 0 };
  if (proposal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("PROPOSAL", proposal.id, actorId), active: 0 };
  return syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal, options), actorId);
}

export async function syncTaskDiscipline(taskId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const task = await prisma.taskActivity.findUnique({ where: { id: taskId } });
  if (!task) return { created: 0, resolved: 0, active: 0 };
  if (task.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("TASK", task.id, actorId), active: 0 };
  return syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task, options), actorId);
}
