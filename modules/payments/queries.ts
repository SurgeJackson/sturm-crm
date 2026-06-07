import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dealAccessWhere } from "@/modules/crm/access-where";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { paymentStatusLabels, paymentTypeLabels } from "@/lib/constants";
import type { PermissionUser } from "@/permissions";

export type PaymentListSearchParams = {
  dealId?: string;
  designerId?: string;
  clientId?: string;
  status?: string;
  paymentType?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
  saved?: string;
  confirmed?: string;
  cancelled?: string;
  error?: string;
};

const PAGE_SIZE = 20;

export function paymentInclude() {
  return {
    deal: { select: { id: true, title: true, responsibleId: true, createdById: true } },
    client: { select: { id: true, name: true } },
    object: { select: { id: true, title: true } },
    designer: { select: { id: true, name: true, responsibleId: true, createdById: true } },
    createdBy: { select: { id: true, name: true } },
    confirmedBy: { select: { id: true, name: true } },
    accruals: { select: { id: true, bonusAmount: true, status: true } }
  } satisfies Prisma.PaymentInclude;
}

export async function getPayments(params: PaymentListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const filters: Prisma.PaymentWhereInput[] = [
    { archivedAt: null },
    { deal: dealAccessWhere(user) }
  ];

  const status = enumParam(params.status, paymentStatusLabels);
  const paymentType = enumParam(params.paymentType, paymentTypeLabels);
  if (params.dealId) filters.push({ dealId: params.dealId });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (status) filters.push({ status });
  if (paymentType) filters.push({ paymentType });
  if (params.from) filters.push({ paymentDate: { gte: new Date(`${params.from}T00:00:00.000Z`) } });
  if (params.to) filters.push({ paymentDate: { lte: new Date(`${params.to}T23:59:59.999Z`) } });

  const where: Prisma.PaymentWhereInput = { AND: filters };
  const orderBy = sortFromParam<Prisma.PaymentOrderByWithRelationInput>(params.sort, {
    amount: { amount: "desc" },
    paymentDate: { paymentDate: "desc" }
  }, { paymentDate: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: paymentInclude()
    }),
    countRows: () => prisma.payment.count({ where })
  });
}

export async function getPaymentFormContext(user: PermissionUser) {
  const deals = await prisma.deal.findMany({
    where: {
      ...dealAccessWhere(user),
      archivedAt: null
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      client: { select: { id: true, name: true } },
      projectObject: { select: { id: true, title: true } },
      designer: { select: { id: true, name: true } }
    }
  });

  return { deals };
}
