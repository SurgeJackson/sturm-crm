import type { Prisma } from "@/generated/prisma/client";
import { taskAccessWhere } from "@/modules/crm/access-where";
import { closedTaskStatuses } from "@/modules/crm/domain-constants";
import {
  clientNameSelect,
  dealTitleSelect,
  designerNameSelect,
  objectTitleSelect,
  proposalNumberSelect,
  userSummarySelect
} from "@/modules/crm/selects";

export type TaskListSearchParams = {
  q?: string;
  recordType?: string;
  responsibleId?: string;
  status?: string;
  priority?: string;
  due?: string;
  today?: string;
  overdue?: string;
  noResult?: string;
  entityType?: string;
  entityId?: string;
  page?: string;
};

export type TaskCalendarSearchParams = {
  date?: string;
  responsibleId?: string;
  mine?: string;
};

export type ActivityReportSearchParams = {
  from?: string;
  to?: string;
  responsibleId?: string;
  actionType?: string;
  entityType?: string;
};

export const TASK_PAGE_SIZE = 30;

export { taskAccessWhere };

export function activeTaskWhere(now = new Date()): Prisma.TaskActivityWhereInput {
  return {
    recordType: "TASK",
    archivedAt: null,
    status: { notIn: closedTaskStatuses },
    dueAt: { lt: now }
  };
}

export function taskInclude() {
  return {
    responsible: { select: userSummarySelect },
    createdBy: { select: userSummarySelect },
    client: { select: clientNameSelect },
    designer: { select: designerNameSelect },
    projectObject: { select: objectTitleSelect },
    deal: { select: dealTitleSelect },
    proposal: { select: proposalNumberSelect },
    objectParticipant: { select: { id: true, fullName: true, objectId: true } }
  } satisfies Prisma.TaskActivityInclude;
}

export function linkedEntityWhere(entityType?: string, entityId?: string): Prisma.TaskActivityWhereInput | null {
  if (!entityType || !entityId) return null;
  if (entityType === "client") return { clientId: entityId };
  if (entityType === "designer") return { designerId: entityId };
  if (entityType === "object") return { objectId: entityId };
  if (entityType === "deal") return { dealId: entityId };
  if (entityType === "proposal") return { proposalId: entityId };
  if (entityType === "participant") return { objectParticipantId: entityId };
  return null;
}
