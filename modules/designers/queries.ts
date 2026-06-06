import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { designerAccessWhere } from "@/modules/crm/access-where";
import { DETAIL_TASK_LIMIT } from "@/modules/crm/detail-limits";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { userSummarySelect } from "@/modules/crm/selects";
import { taskInclude } from "@/modules/tasks/queries";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity, getActiveViolationsMap } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

export type DesignerListSearchParams = {
  q?: string;
  role?: string;
  relationshipStage?: string;
  potential?: string;
  loyalty?: string;
  responsibleId?: string;
  noNextStep?: string;
  noTouch60?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 20;

export async function getDesigners(params: DesignerListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const filters: Prisma.DesignerWhereInput[] = [designerAccessWhere(user)];

  if (params.q) {
    filters.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { studio: { contains: params.q, mode: "insensitive" } },
        { phone: { contains: params.q } },
        { email: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }

  const role = enumParam(params.role, designerRoleLabels);
  const relationshipStage = enumParam(params.relationshipStage, designerRelationshipStageLabels);
  const potential = enumParam(params.potential, designerPotentialLabels);
  const loyalty = enumParam(params.loyalty, designerLoyaltyLabels);
  if (role) filters.push({ role });
  if (relationshipStage) filters.push({ relationshipStage });
  if (potential) filters.push({ potential });
  if (loyalty) filters.push({ loyalty });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (flagParam(params.noNextStep)) {
    filters.push({ OR: [{ nextStepAt: null }, { nextStepText: null }] });
  }
  if (flagParam(params.noTouch60)) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 60);
    filters.push({ OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: threshold } }] });
  }

  const where: Prisma.DesignerWhereInput = { AND: filters };

  const orderBy = sortFromParam<Prisma.DesignerOrderByWithRelationInput>(params.sort, {
    name: { name: "asc" },
    nextStepAt: { nextStepAt: "asc" }
  }, { createdAt: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.designer.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: userSummarySelect },
        createdBy: { select: userSummarySelect }
      }
    }),
    countRows: () => prisma.designer.count({ where }),
    mapRows: async (rows) => {
      const violations = await getActiveViolationsMap("DESIGNER", rows.map((item) => item.id));
      return rows.map((item) => {
        const crmViolations = violations.get(item.id) ?? [];
        return {
          ...item,
          crmViolations,
          bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
        };
      });
    }
  });
}

export async function getDesignerForUser(id: string, user: PermissionUser) {
  const designer = await prisma.designer.findUnique({
    where: { id },
    include: {
      responsible: { select: userSummarySelect },
      createdBy: { select: userSummarySelect },
      projectObjects: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, name: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          projectObject: { select: { id: true, title: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      proposals: {
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          deal: { select: { id: true, title: true } },
          projectObject: { select: { id: true, title: true } },
          responsible: { select: { id: true, name: true } }
        }
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        take: DETAIL_TASK_LIMIT,
        include: taskInclude()
      }
    }
  });

  if (!designer || !canViewRecord(user, designer)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("DESIGNER", designer.id);
  return {
    ...designer,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
  };
}

export async function getDesignerPipeline(user: PermissionUser) {
  const designers = await prisma.designer.findMany({
    where: {
      ...designerAccessWhere(user),
      archivedAt: null
    },
    orderBy: [{ nextStepAt: "asc" }, { createdAt: "desc" }],
    include: {
      responsible: { select: userSummarySelect }
    }
  });

  return designers;
}
