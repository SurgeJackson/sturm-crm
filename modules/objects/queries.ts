import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { objectAccessWhere } from "@/modules/crm/access-where";
import { pageFromParam, paginatedResult } from "@/modules/crm/pagination";
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

  if (params.objectType) filters.push({ objectType: params.objectType as never });
  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.status) filters.push({ status: params.status as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.noResponsible === "1") filters.push({ responsibleId: "" });
  if (params.noClient === "1") filters.push({ clientId: "" });
  if (params.noDesigner === "1") filters.push({ designerId: null });
  if (params.noTasks === "1") filters.push({ tasks: { none: { archivedAt: null } } });
  if (params.frozen === "1") filters.push({ OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] });
  if (params.lost === "1") filters.push({ OR: [{ status: "LOST" }, { stage: "LOST" }] });

  const where: Prisma.ProjectObjectWhereInput = { AND: filters };
  const orderBy: Prisma.ProjectObjectOrderByWithRelationInput =
    params.sort === "title"
      ? { title: "asc" }
      : params.sort === "implementationStartAt"
        ? { implementationStartAt: "asc" }
        : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.projectObject.findMany({
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
    prisma.projectObject.count({ where })
  ]);
  const items = await withCrmViolations("OBJECT", rows);
  return paginatedResult(items, total, page, PAGE_SIZE);
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
        take: 30,
        include: taskInclude()
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          responsible: { select: { id: true, name: true } }
        }
      },
      proposals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
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
