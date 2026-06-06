import { prisma } from "@/lib/prisma";
import { processCursorBatches } from "@/modules/crm-discipline/batch-runner";
import {
  validateClientForDiscipline,
  validateDealForDiscipline,
  validateDesignerForDiscipline,
  validateObjectForDiscipline,
  validateProposalForDiscipline,
  validateTaskForDiscipline
} from "@/modules/crm-discipline/rules";
import {
  DEFAULT_DISCIPLINE_BATCH_SIZE,
  syncViolationsForEntity,
  type CrmDisciplineSyncOptions
} from "@/modules/crm-discipline/violation-sync";

export async function runCrmDisciplineCheck(actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const ruleOptions = { now: options?.now ?? new Date() };
  const batchSize = Math.max(options?.batchSize ?? DEFAULT_DISCIPLINE_BATCH_SIZE, 1);

  const results = await Promise.all([
    processCursorBatches(
      (cursorId) => prisma.client.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (client) => syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.designer.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (designer) => syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.projectObject.findMany({
        where: { archivedAt: null },
        include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (object) => syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.deal.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (deal) => syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.commercialProposal.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (proposal) => syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.taskActivity.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (task) => syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task, ruleOptions), actorId)
    )
  ]);

  return results.reduce(
    (acc, item) => ({
      checked: acc.checked + item.checked,
      created: acc.created + item.created,
      resolved: acc.resolved + item.resolved,
      active: acc.active + item.active
    }),
    { checked: 0, created: 0, resolved: 0, active: 0 }
  );
}
