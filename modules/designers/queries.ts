import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { designerAccessWhere } from "@/modules/crm/access-where";
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
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
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

  if (params.role) filters.push({ role: params.role as never });
  if (params.relationshipStage) filters.push({ relationshipStage: params.relationshipStage as never });
  if (params.potential) filters.push({ potential: params.potential as never });
  if (params.loyalty) filters.push({ loyalty: params.loyalty as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.noNextStep === "1") {
    filters.push({ OR: [{ nextStepAt: null }, { nextStepText: null }] });
  }
  if (params.noTouch60 === "1") {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 60);
    filters.push({ OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: threshold } }] });
  }

  const where: Prisma.DesignerWhereInput = { AND: filters };

  const orderBy: Prisma.DesignerOrderByWithRelationInput =
    params.sort === "name"
      ? { name: "asc" }
      : params.sort === "nextStepAt"
        ? { nextStepAt: "asc" }
        : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.designer.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        responsible: { select: userSummarySelect },
        createdBy: { select: userSummarySelect }
      }
    }),
    prisma.designer.count({ where })
  ]);
  const violations = await getActiveViolationsMap("DESIGNER", rows.map((item) => item.id));
  const items = rows.map((item) => {
    const crmViolations = violations.get(item.id) ?? [];
    return {
      ...item,
      crmViolations,
      bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
    };
  });

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  };
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
        take: 30,
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
