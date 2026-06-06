import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { objectStageLabels, objectStatusLabels, objectTypeLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { objectAccessWhere } from "@/modules/crm/access-where";
import { DETAIL_DEAL_LIMIT, DETAIL_PROPOSAL_LIMIT, DETAIL_TASK_LIMIT } from "@/modules/crm/detail-limits";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { userSummarySelect } from "@/modules/crm/selects";
import { withCrmViolations } from "@/modules/crm/violation-enrichment";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

export type ObjectListSearchParams = {
  q?: string;
  objectType?: string;
  stage?: string;
  status?: string;
  responsibleId?: string;
  clientId?: string;
  designerId?: string;
  noResponsible?: string;
  noClient?: string;
  noDesigner?: string;
  noTasks?: string;
  frozen?: string;
  lost?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;
export { objectAccessWhere };

export async function getProjectObjects(params: ObjectListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const filters: Prisma.ProjectObjectWhereInput[] = [objectAccessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { title: { contains: params.q, mode: "insensitive" } },
        { address: { contains: params.q, mode: "insensitive" } },
        { city: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }

  const objectType = enumParam(params.objectType, objectTypeLabels);
  const stage = enumParam(params.stage, objectStageLabels);
  const status = enumParam(params.status, objectStatusLabels);
  if (objectType) filters.push({ objectType });
  if (stage) filters.push({ stage });
  if (status) filters.push({ status });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (flagParam(params.noResponsible)) filters.push({ responsibleId: "" });
  if (flagParam(params.noClient)) filters.push({ clientId: "" });
  if (flagParam(params.noDesigner)) filters.push({ designerId: null });
  if (flagParam(params.noTasks)) filters.push({ tasks: { none: { archivedAt: null } } });
  if (flagParam(params.frozen)) filters.push({ OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] });
  if (flagParam(params.lost)) filters.push({ OR: [{ status: "LOST" }, { stage: "LOST" }] });

  const where: Prisma.ProjectObjectWhereInput = { AND: filters };
  const orderBy = sortFromParam<Prisma.ProjectObjectOrderByWithRelationInput>(params.sort, {
    title: { title: "asc" },
    implementationStartAt: { implementationStartAt: "asc" }
  }, { createdAt: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.projectObject.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        client: { select: { id: true, name: true } },
        designer: { select: { id: true, name: true, studio: true, relationshipStage: true } },
        responsible: { select: userSummarySelect },
        _count: { select: { participants: true, tasks: true, deals: true, proposals: true } }
      }
    }),
    countRows: () => prisma.projectObject.count({ where }),
    mapRows: (rows) => withCrmViolations("OBJECT", rows)
  });
}

export async function getProjectObjectForUser(id: string, user: PermissionUser) {
  const object = await prisma.projectObject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true } },
      designer: { select: { id: true, name: true, studio: true, relationshipStage: true } },
      responsible: { select: userSummarySelect },
      createdBy: { select: userSummarySelect },
      participants: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          responsible: { select: userSummarySelect },
          createdBy: { select: userSummarySelect }
        }
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: DETAIL_TASK_LIMIT,
        include: taskInclude()
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: DETAIL_DEAL_LIMIT,
        include: {
          responsible: { select: { id: true, name: true } }
        }
      },
      proposals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: DETAIL_PROPOSAL_LIMIT,
        include: {
          deal: { select: { id: true, title: true } },
          responsible: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!object || !canViewRecord(user, object)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("OBJECT", object.id);
  return {
    ...object,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations)
  };
}

export async function getProjectObjectParticipantForUser(
  objectId: string,
  participantId: string,
  user: PermissionUser
) {
  const [object, participant] = await Promise.all([
    getProjectObjectForUser(objectId, user),
    prisma.projectObjectParticipant.findUnique({ where: { id: participantId } })
  ]);

  if (!participant || participant.objectId !== object.id) {
    notFound();
  }

  return { object, participant };
}
