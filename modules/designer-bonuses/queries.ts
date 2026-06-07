import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { designerBonusAccrualStatusLabels, designerBonusPayoutStatusLabels } from "@/lib/constants";
import { designerAccessWhere, dealAccessWhere, objectAccessWhere } from "@/modules/crm/access-where";
import { paginatedQuery } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { calculateDesignerBonusBalance, calculateDesignerBonusBalances } from "@/modules/designer-bonuses/service";
import type { PermissionUser } from "@/permissions";

export type BonusListSearchParams = {
  designerId?: string;
  dealId?: string;
  objectId?: string;
  status?: string;
  responsibleId?: string;
  from?: string;
  to?: string;
  page?: string;
  saved?: string;
  paid?: string;
  error?: string;
};

export type DesignerBonusReportParams = BonusListSearchParams & {
  positiveBalance?: string;
  unpaidOnly?: string;
};

const PAGE_SIZE = 20;

export function bonusAccrualInclude() {
  return {
    designer: { select: { id: true, name: true, responsibleId: true, createdById: true } },
    deal: { select: { id: true, title: true, responsibleId: true, createdById: true } },
    object: { select: { id: true, title: true } },
    client: { select: { id: true, name: true } },
    payment: { select: { id: true, amount: true, paymentDate: true } },
    createdBy: { select: { id: true, name: true } }
  } satisfies Prisma.DesignerBonusAccrualInclude;
}

export function bonusPayoutInclude() {
  return {
    designer: { select: { id: true, name: true, responsibleId: true, createdById: true } },
    createdBy: { select: { id: true, name: true } },
    approvedBy: { select: { id: true, name: true } },
    paidBy: { select: { id: true, name: true } }
  } satisfies Prisma.DesignerBonusPayoutInclude;
}

function periodFilters(from?: string, to?: string, field: "accrualDate" | "payoutDate" = "accrualDate") {
  const filters: Prisma.DesignerBonusAccrualWhereInput[] = [];
  if (from) filters.push({ [field]: { gte: new Date(`${from}T00:00:00.000Z`) } });
  if (to) filters.push({ [field]: { lte: new Date(`${to}T23:59:59.999Z`) } });
  return filters;
}

export async function getBonusAccruals(params: BonusListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const filters: Prisma.DesignerBonusAccrualWhereInput[] = [
    { archivedAt: null },
    { deal: dealAccessWhere(user) }
  ];

  const status = enumParam(params.status, designerBonusAccrualStatusLabels);
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.dealId) filters.push({ dealId: params.dealId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.responsibleId) filters.push({ deal: { responsibleId: params.responsibleId } });
  if (status) filters.push({ status });
  filters.push(...periodFilters(params.from, params.to));

  const where: Prisma.DesignerBonusAccrualWhereInput = { AND: filters };

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.designerBonusAccrual.findMany({
      where,
      orderBy: { accrualDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: bonusAccrualInclude()
    }),
    countRows: () => prisma.designerBonusAccrual.count({ where })
  });
}

export async function getBonusPayouts(params: BonusListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const filters: Prisma.DesignerBonusPayoutWhereInput[] = [
    { archivedAt: null },
    { designer: designerAccessWhere(user) }
  ];

  const status = enumParam(params.status, designerBonusPayoutStatusLabels);
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (status) filters.push({ status });
  if (params.from) filters.push({ payoutDate: { gte: new Date(`${params.from}T00:00:00.000Z`) } });
  if (params.to) filters.push({ payoutDate: { lte: new Date(`${params.to}T23:59:59.999Z`) } });

  const where: Prisma.DesignerBonusPayoutWhereInput = { AND: filters };

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.designerBonusPayout.findMany({
      where,
      orderBy: { payoutDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: bonusPayoutInclude()
    }),
    countRows: () => prisma.designerBonusPayout.count({ where })
  });
}

export async function getDesignerBonusSnapshot(designerId: string) {
  const [agreements, accruals, payouts, adjustments, balance] = await Promise.all([
    prisma.designerBonusAgreement.findMany({
      where: { designerId, archivedAt: null },
      orderBy: [{ status: "asc" }, { validFrom: "desc" }]
    }),
    prisma.designerBonusAccrual.findMany({
      where: { designerId, archivedAt: null },
      orderBy: { accrualDate: "desc" },
      take: 20,
      include: bonusAccrualInclude()
    }),
    prisma.designerBonusPayout.findMany({
      where: { designerId, archivedAt: null },
      orderBy: { payoutDate: "desc" },
      take: 20,
      include: bonusPayoutInclude()
    }),
    prisma.designerBonusAdjustment.findMany({
      where: { designerId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      }
    }),
    calculateDesignerBonusBalance(designerId)
  ]);

  return { agreements, accruals, payouts, adjustments, balance };
}

export async function getBonusFormContext(user: PermissionUser) {
  const [designers, deals, objects, payableAccruals] = await Promise.all([
    prisma.designer.findMany({
      where: { ...designerAccessWhere(user), archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, responsibleId: true, createdById: true }
    }),
    prisma.deal.findMany({
      where: { ...dealAccessWhere(user), archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { id: true, title: true, designerId: true }
    }),
    prisma.projectObject.findMany({
      where: { ...objectAccessWhere(user), archivedAt: null },
      orderBy: { title: "asc" },
      take: 300,
      select: { id: true, title: true, designerId: true }
    }),
    prisma.designerBonusAccrual.findMany({
      where: {
        archivedAt: null,
        status: { in: ["ACCRUED", "APPROVED"] },
        bonusAmount: { gt: 0 },
        deal: dealAccessWhere(user)
      },
      orderBy: { accrualDate: "desc" },
      take: 300,
      select: {
        id: true,
        designerId: true,
        bonusAmount: true,
        accrualDate: true,
        deal: { select: { id: true, title: true } },
        payment: { select: { id: true, amount: true, paymentDate: true } }
      }
    })
  ]);

  return { designers, deals, objects, payableAccruals };
}

export async function getDesignerBonusReports(params: DesignerBonusReportParams, user: PermissionUser) {
  const designers = await prisma.designer.findMany({
    where: { ...designerAccessWhere(user), archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, responsibleId: true, createdById: true }
  });

  const balanceMap = await calculateDesignerBonusBalances(designers.map((designer) => designer.id));
  const balances = designers.map((designer) => ({
    designer,
    balance: balanceMap.get(designer.id) ?? {
      accruedTotal: 0,
      paidTotal: 0,
      adjustmentTotal: 0,
      pendingTotal: 0,
      balance: 0,
      lastPaymentAt: null,
      lastAccrualAt: null,
      lastPayoutAt: null
    }
  }));
  const balanceRows = flagParam(params.positiveBalance) ? balances.filter((row) => row.balance.balance > 0) : balances;

  const [accruals, payouts] = await Promise.all([
    prisma.designerBonusAccrual.findMany({
      where: {
        archivedAt: null,
        deal: dealAccessWhere(user),
        ...(params.designerId ? { designerId: params.designerId } : {}),
        ...(params.dealId ? { dealId: params.dealId } : {}),
        ...(params.objectId ? { objectId: params.objectId } : {}),
        ...(params.from || params.to ? {
          accrualDate: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00.000Z`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999Z`) } : {})
          }
        } : {})
      },
      orderBy: { accrualDate: "desc" },
      take: 100,
      include: bonusAccrualInclude()
    }),
    prisma.designerBonusPayout.findMany({
      where: {
        archivedAt: null,
        designer: designerAccessWhere(user),
        ...(params.designerId ? { designerId: params.designerId } : {}),
        ...(params.from || params.to ? {
          payoutDate: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00.000Z`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999Z`) } : {})
          }
        } : {})
      },
      orderBy: { payoutDate: "desc" },
      take: 100,
      include: bonusPayoutInclude()
    })
  ]);

  const dealRows = await prisma.deal.findMany({
    where: {
      ...dealAccessWhere(user),
      archivedAt: null,
      ...(params.dealId ? { id: params.dealId } : {}),
      ...(params.objectId ? { objectId: params.objectId } : {}),
      ...(params.designerId ? { designerId: params.designerId } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: { select: { id: true, name: true } },
      projectObject: { select: { id: true, title: true } },
      designer: { select: { id: true, name: true } },
      payments: { where: { status: "CONFIRMED", archivedAt: null } },
      bonusAccruals: { where: { archivedAt: null } }
    }
  });

  return {
    balances: balanceRows,
    accruals,
    payouts,
    debtors: balances.filter((row) => row.balance.balance > 0),
    deals: flagParam(params.unpaidOnly)
      ? dealRows.filter((deal) => deal.bonusAccruals.reduce((sum, accrual) => sum + accrual.bonusAmount, 0) > 0)
      : dealRows
  };
}
