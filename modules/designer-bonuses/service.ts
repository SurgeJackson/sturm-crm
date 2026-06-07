import type {
  DesignerBonusAccrual,
  DesignerBonusAgreement,
  DesignerBonusAgreementStatus,
  DesignerBonusAgreementType,
  DesignerBonusAppliesTo,
  DesignerBonusCalculationBase,
  DesignerBonusPayout,
  DesignerBonusAdjustment,
  Payment,
  Prisma,
  PrismaClient
} from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { writeSecurityLog } from "@/lib/security-log";

type BonusClient = PrismaClient | Prisma.TransactionClient;

export type DesignerBonusBalance = {
  accruedTotal: number;
  paidTotal: number;
  adjustmentTotal: number;
  pendingTotal: number;
  balance: number;
  lastPaymentAt: Date | null;
  lastAccrualAt: Date | null;
  lastPayoutAt: Date | null;
};

export class DesignerBonusServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesignerBonusServiceError";
  }
}

export function bonusAmountFromPayment(amount: number, percent: number, isRefund = false) {
  const baseAmount = isRefund ? -Math.abs(amount) : amount;
  return {
    baseAmount,
    bonusAmount: Math.round((baseAmount * percent / 100) * 100) / 100
  };
}

export function adjustmentBalanceAmount(amount: number, type: string) {
  if (type === "WRITE_OFF" || type === "CORRECTION_MINUS") return -Math.abs(amount);
  return Math.abs(amount);
}

export async function getActiveBonusAgreement(
  designerId: string,
  at: Date,
  dealId?: string | null,
  client: BonusClient = prisma
) {
  const agreements = await client.designerBonusAgreement.findMany({
    where: {
      designerId,
      status: "ACTIVE",
      archivedAt: null,
      validFrom: { lte: at },
      OR: [{ validTo: null }, { validTo: { gte: at } }]
    },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }]
  });

  return agreements.find((agreement) => agreementAppliesToDeal(agreement, dealId)) ?? null;
}

export function agreementAppliesToDeal(
  agreement: Pick<DesignerBonusAgreement, "appliesTo" | "specificDealIds">,
  dealId?: string | null
) {
  if (agreement.appliesTo === "ALL_DEALS") return true;
  if (agreement.appliesTo === "SPECIFIC_DEALS") return Boolean(dealId && agreement.specificDealIds.includes(dealId));
  return false;
}

export function canAutoAccrueFromAgreement(agreement: Pick<DesignerBonusAgreement, "agreementType" | "calculationBase" | "bonusPercent">) {
  return (
    (agreement.agreementType === "STANDARD_PERCENT" || agreement.agreementType === "INDIVIDUAL_PERCENT") &&
    agreement.calculationBase === "PAYMENT_AMOUNT" &&
    typeof agreement.bonusPercent === "number" &&
    agreement.bonusPercent > 0
  );
}

export async function createAccrualForConfirmedPayment(payment: Payment, actorId: string, client: BonusClient = prisma) {
  if (payment.status !== "CONFIRMED" || !payment.designerId || payment.archivedAt) return null;

  const agreement = await getActiveBonusAgreement(payment.designerId, payment.paymentDate, payment.dealId, client);
  if (!agreement || !canAutoAccrueFromAgreement(agreement)) return null;

  const isRefund = payment.paymentType === "REFUND";
  const { baseAmount, bonusAmount } = bonusAmountFromPayment(payment.amount, agreement.bonusPercent ?? 0, isRefund);
  const accrualType = isRefund ? "REFUND_REVERSAL" : "AUTO_FROM_PAYMENT";

  const existing = await client.designerBonusAccrual.findFirst({
    where: {
      designerId: payment.designerId,
      paymentId: payment.id,
      accrualType,
      archivedAt: null
    }
  });
  if (existing) return existing;

  const accrual = await client.designerBonusAccrual.create({
    data: {
      designerId: payment.designerId,
      agreementId: agreement.id,
      paymentId: payment.id,
      dealId: payment.dealId,
      objectId: payment.objectId,
      clientId: payment.clientId,
      baseAmount,
      bonusPercent: agreement.bonusPercent ?? 0,
      bonusAmount,
      accrualDate: payment.paymentDate,
      status: "ACCRUED",
      accrualType,
      comment: isRefund ? "Сторно бонуса по возврату оплаты" : "Автоматическое начисление по подтвержденной оплате",
      createdById: actorId
    }
  });

  await writeAuditLog({
    entityType: "DESIGNER_BONUS_ACCRUAL",
    entityId: accrual.id,
    action: "CREATE_FROM_PAYMENT",
    userId: actorId,
    after: accrual
  }, client);

  return accrual;
}

export async function cancelPaymentAccruals(paymentId: string, actorId: string, client: BonusClient = prisma) {
  const accruals = await client.designerBonusAccrual.findMany({
    where: {
      paymentId,
      status: { in: ["ACCRUED", "APPROVED"] },
      archivedAt: null
    }
  });

  for (const accrual of accruals) {
    const updated = await client.designerBonusAccrual.update({
      where: { id: accrual.id },
      data: {
        status: "CANCELLED",
        comment: accrual.comment ? `${accrual.comment}\nОтменено вместе с оплатой.` : "Отменено вместе с оплатой."
      }
    });
    await writeAuditLog({
      entityType: "DESIGNER_BONUS_ACCRUAL",
      entityId: accrual.id,
      action: "CANCEL_WITH_PAYMENT",
      userId: actorId,
      before: accrual,
      after: updated
    }, client);
  }

  return accruals.length;
}

export async function calculateDesignerBonusBalance(designerId: string, client: BonusClient = prisma): Promise<DesignerBonusBalance> {
  const [accrued, pending, paid, adjustments, lastPayment, lastAccrual, lastPayout] = await Promise.all([
    client.designerBonusAccrual.aggregate({
      where: { designerId, status: { in: ["ACCRUED", "APPROVED", "PAID"] }, archivedAt: null },
      _sum: { bonusAmount: true }
    }),
    client.designerBonusAccrual.aggregate({
      where: { designerId, status: "DRAFT", archivedAt: null },
      _sum: { bonusAmount: true }
    }),
    client.designerBonusPayout.aggregate({
      where: { designerId, status: "PAID", archivedAt: null },
      _sum: { amount: true }
    }),
    client.designerBonusAdjustment.findMany({
      where: { designerId, approvedAt: { not: null }, archivedAt: null },
      select: { amount: true, adjustmentType: true }
    }),
    client.payment.findFirst({
      where: { designerId, status: "CONFIRMED", archivedAt: null },
      orderBy: { paymentDate: "desc" },
      select: { paymentDate: true }
    }),
    client.designerBonusAccrual.findFirst({
      where: { designerId, archivedAt: null },
      orderBy: { accrualDate: "desc" },
      select: { accrualDate: true }
    }),
    client.designerBonusPayout.findFirst({
      where: { designerId, status: "PAID", archivedAt: null },
      orderBy: { payoutDate: "desc" },
      select: { payoutDate: true }
    })
  ]);

  const accruedTotal = accrued._sum.bonusAmount ?? 0;
  const paidTotal = paid._sum.amount ?? 0;
  const adjustmentTotal = adjustments.reduce((sum, adjustment) => sum + adjustmentBalanceAmount(adjustment.amount, adjustment.adjustmentType), 0);
  const pendingTotal = pending._sum.bonusAmount ?? 0;

  return {
    accruedTotal,
    paidTotal,
    adjustmentTotal,
    pendingTotal,
    balance: accruedTotal + adjustmentTotal - paidTotal,
    lastPaymentAt: lastPayment?.paymentDate ?? null,
    lastAccrualAt: lastAccrual?.accrualDate ?? null,
    lastPayoutAt: lastPayout?.payoutDate ?? null
  };
}

export async function calculateDesignerBonusBalances(designerIds: string[], client: BonusClient = prisma) {
  const uniqueIds = Array.from(new Set(designerIds));
  const empty = new Map<string, DesignerBonusBalance>();
  if (uniqueIds.length === 0) return empty;

  const [accrued, pending, paid, adjustments, payments, accrualDates, payoutDates] = await Promise.all([
    client.designerBonusAccrual.groupBy({
      by: ["designerId"],
      where: { designerId: { in: uniqueIds }, status: { in: ["ACCRUED", "APPROVED", "PAID"] }, archivedAt: null },
      _sum: { bonusAmount: true }
    }),
    client.designerBonusAccrual.groupBy({
      by: ["designerId"],
      where: { designerId: { in: uniqueIds }, status: "DRAFT", archivedAt: null },
      _sum: { bonusAmount: true }
    }),
    client.designerBonusPayout.groupBy({
      by: ["designerId"],
      where: { designerId: { in: uniqueIds }, status: "PAID", archivedAt: null },
      _sum: { amount: true }
    }),
    client.designerBonusAdjustment.findMany({
      where: { designerId: { in: uniqueIds }, approvedAt: { not: null }, archivedAt: null },
      select: { designerId: true, amount: true, adjustmentType: true }
    }),
    client.payment.findMany({
      where: { designerId: { in: uniqueIds }, status: "CONFIRMED", archivedAt: null },
      orderBy: { paymentDate: "desc" },
      select: { designerId: true, paymentDate: true }
    }),
    client.designerBonusAccrual.findMany({
      where: { designerId: { in: uniqueIds }, archivedAt: null },
      orderBy: { accrualDate: "desc" },
      select: { designerId: true, accrualDate: true }
    }),
    client.designerBonusPayout.findMany({
      where: { designerId: { in: uniqueIds }, status: "PAID", archivedAt: null },
      orderBy: { payoutDate: "desc" },
      select: { designerId: true, payoutDate: true }
    })
  ]);

  const accruedByDesigner = new Map(accrued.map((row) => [row.designerId, row._sum.bonusAmount ?? 0]));
  const pendingByDesigner = new Map(pending.map((row) => [row.designerId, row._sum.bonusAmount ?? 0]));
  const paidByDesigner = new Map(paid.map((row) => [row.designerId, row._sum.amount ?? 0]));
  const adjustmentByDesigner = new Map<string, number>();
  const lastPaymentByDesigner = new Map<string, Date>();
  const lastAccrualByDesigner = new Map<string, Date>();
  const lastPayoutByDesigner = new Map<string, Date>();

  for (const adjustment of adjustments) {
    adjustmentByDesigner.set(
      adjustment.designerId,
      (adjustmentByDesigner.get(adjustment.designerId) ?? 0) + adjustmentBalanceAmount(adjustment.amount, adjustment.adjustmentType)
    );
  }
  for (const payment of payments) {
    if (payment.designerId && !lastPaymentByDesigner.has(payment.designerId)) lastPaymentByDesigner.set(payment.designerId, payment.paymentDate);
  }
  for (const accrual of accrualDates) {
    if (!lastAccrualByDesigner.has(accrual.designerId)) lastAccrualByDesigner.set(accrual.designerId, accrual.accrualDate);
  }
  for (const payout of payoutDates) {
    if (!lastPayoutByDesigner.has(payout.designerId)) lastPayoutByDesigner.set(payout.designerId, payout.payoutDate);
  }

  return new Map(uniqueIds.map((designerId) => {
    const accruedTotal = accruedByDesigner.get(designerId) ?? 0;
    const paidTotal = paidByDesigner.get(designerId) ?? 0;
    const adjustmentTotal = adjustmentByDesigner.get(designerId) ?? 0;
    const pendingTotal = pendingByDesigner.get(designerId) ?? 0;
    return [designerId, {
      accruedTotal,
      paidTotal,
      adjustmentTotal,
      pendingTotal,
      balance: accruedTotal + adjustmentTotal - paidTotal,
      lastPaymentAt: lastPaymentByDesigner.get(designerId) ?? null,
      lastAccrualAt: lastAccrualByDesigner.get(designerId) ?? null,
      lastPayoutAt: lastPayoutByDesigner.get(designerId) ?? null
    }];
  }));
}

export async function createOrUpdateAgreement(
  data: {
    id?: string;
    designerId: string;
    agreementType: DesignerBonusAgreementType;
    bonusPercent: number | null;
    calculationBase: DesignerBonusCalculationBase;
    appliesTo: DesignerBonusAppliesTo;
    specificDealIds: string[];
    validFrom: Date;
    validTo: Date | null;
    status: DesignerBonusAgreementStatus;
    requiresApproval: boolean;
    comment: string | null;
  },
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    if (data.status === "ACTIVE" && data.appliesTo === "ALL_DEALS") {
      await tx.designerBonusAgreement.updateMany({
        where: {
          designerId: data.designerId,
          appliesTo: "ALL_DEALS",
          status: "ACTIVE",
          archivedAt: null,
          ...(data.id ? { id: { not: data.id } } : {})
        },
        data: { status: "ENDED" }
      });
    }

    const before = data.id ? await tx.designerBonusAgreement.findUnique({ where: { id: data.id } }) : null;
    const agreement = data.id
      ? await tx.designerBonusAgreement.update({
        where: { id: data.id },
        data: {
          agreementType: data.agreementType,
          bonusPercent: data.bonusPercent,
          calculationBase: data.calculationBase,
          appliesTo: data.appliesTo,
          specificDealIds: data.specificDealIds,
          validFrom: data.validFrom,
          validTo: data.validTo,
          status: data.status,
          requiresApproval: data.requiresApproval,
          comment: data.comment,
          approvedById: data.status === "ACTIVE" ? actorId : before?.approvedById ?? null,
          approvedAt: data.status === "ACTIVE" ? new Date() : before?.approvedAt ?? null
        }
      })
      : await tx.designerBonusAgreement.create({
        data: {
          designerId: data.designerId,
          agreementType: data.agreementType,
          bonusPercent: data.bonusPercent,
          calculationBase: data.calculationBase,
          appliesTo: data.appliesTo,
          specificDealIds: data.specificDealIds,
          validFrom: data.validFrom,
          validTo: data.validTo,
          status: data.status,
          requiresApproval: data.requiresApproval,
          comment: data.comment,
          createdById: actorId,
          approvedById: data.status === "ACTIVE" ? actorId : null,
          approvedAt: data.status === "ACTIVE" ? new Date() : null
        }
      });

    await writeAuditLog({
      entityType: "DESIGNER_BONUS_AGREEMENT",
      entityId: agreement.id,
      action: before ? "UPDATE" : "CREATE",
      userId: actorId,
      before,
      after: agreement
    }, tx);

    if (before?.bonusPercent !== agreement.bonusPercent) {
      await writeSecurityLog({
        action: "CHANGE_DESIGNER_BONUS_PERCENT",
        userId: actorId,
        entityType: "DESIGNER_BONUS_AGREEMENT",
        entityId: agreement.id,
        metadata: { before: before?.bonusPercent, after: agreement.bonusPercent },
        client: tx
      });
    }

    return agreement;
  });
}

export async function createPayout(
  data: Pick<DesignerBonusPayout, "designerId" | "amount" | "payoutDate" | "payoutMethod" | "status" | "linkedAccrualIds" | "comment" | "documentFileUrl">,
  actorId: string,
  options: { allowOverpayment?: boolean } = {}
) {
  return prisma.$transaction(async (tx) => {
    await validatePayoutData(data, tx);
    if (data.status === "PAID") {
      await ensurePayoutWithinBalance(data.designerId, data.amount, tx, options.allowOverpayment);
    }

    const payout = await tx.designerBonusPayout.create({
      data: {
        ...data,
        comment: data.comment ?? null,
        documentFileUrl: data.documentFileUrl ?? null,
        createdById: actorId,
        approvedById: data.status === "APPROVED" || data.status === "PAID" ? actorId : null,
        approvedAt: data.status === "APPROVED" || data.status === "PAID" ? new Date() : null,
        paidById: data.status === "PAID" ? actorId : null,
        paidAt: data.status === "PAID" ? new Date() : null
      }
    });

    await writeAuditLog({
      entityType: "DESIGNER_BONUS_PAYOUT",
      entityId: payout.id,
      action: "CREATE",
      userId: actorId,
      after: payout
    }, tx);
    await writeSecurityLog({
      action: "CREATE_DESIGNER_BONUS_PAYOUT",
      userId: actorId,
      entityType: "DESIGNER_BONUS_PAYOUT",
      entityId: payout.id,
      client: tx
    });

    if (payout.status === "PAID") {
      await markLinkedAccrualsPaid(payout.linkedAccrualIds, actorId, tx);
    }

    return payout;
  });
}

async function validatePayoutData(
  data: Pick<DesignerBonusPayout, "designerId" | "amount" | "linkedAccrualIds">,
  client: BonusClient
) {
  const designer = await client.designer.findFirst({
    where: { id: data.designerId, archivedAt: null },
    select: { id: true }
  });
  if (!designer) throw new DesignerBonusServiceError("Дизайнер не найден или архивирован");

  if (data.linkedAccrualIds.length === 0) return;

  const linkedAccruals = await client.designerBonusAccrual.findMany({
    where: {
      id: { in: data.linkedAccrualIds },
      designerId: data.designerId,
      status: { in: ["ACCRUED", "APPROVED"] },
      bonusAmount: { gt: 0 },
      archivedAt: null
    },
    select: { id: true, bonusAmount: true }
  });
  if (linkedAccruals.length !== data.linkedAccrualIds.length) {
    throw new DesignerBonusServiceError("Выбраны недоступные начисления для выплаты");
  }

  const linkedTotal = linkedAccruals.reduce((sum, accrual) => sum + accrual.bonusAmount, 0);
  if (linkedTotal > data.amount) {
    throw new DesignerBonusServiceError("Сумма выплаты меньше суммы выбранных начислений");
  }
}

async function ensurePayoutWithinBalance(designerId: string, amount: number, client: BonusClient, allowOverpayment = false) {
  const balance = await calculateDesignerBonusBalance(designerId, client);
  if (amount > balance.balance && !allowOverpayment) {
    throw new DesignerBonusServiceError("Нельзя выплатить больше текущего баланса без прав руководителя");
  }
}

async function markLinkedAccrualsPaid(accrualIds: string[], actorId: string, client: BonusClient) {
  if (accrualIds.length === 0) return;

  const accruals = await client.designerBonusAccrual.findMany({
    where: { id: { in: accrualIds }, status: { in: ["ACCRUED", "APPROVED"] }, archivedAt: null }
  });

  for (const accrual of accruals) {
    const updated = await client.designerBonusAccrual.update({
      where: { id: accrual.id },
      data: { status: "PAID" }
    });
    await writeAuditLog({
      entityType: "DESIGNER_BONUS_ACCRUAL",
      entityId: accrual.id,
      action: "MARK_PAID_WITH_PAYOUT",
      userId: actorId,
      before: accrual,
      after: updated
    }, client);
  }
}

export async function markPayoutPaid(id: string, actorId: string, options: { allowOverpayment?: boolean } = {}) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.designerBonusPayout.findUnique({ where: { id } });
    if (!before) return null;
    if (before.status === "PAID") return before;
    await validatePayoutData(before, tx);
    await ensurePayoutWithinBalance(before.designerId, before.amount, tx, options.allowOverpayment);

    const payout = await tx.designerBonusPayout.update({
      where: { id },
      data: {
        status: "PAID",
        approvedById: before.approvedById ?? actorId,
        approvedAt: before.approvedAt ?? new Date(),
        paidById: actorId,
        paidAt: new Date()
      }
    });

    await writeAuditLog({
      entityType: "DESIGNER_BONUS_PAYOUT",
      entityId: id,
      action: "MARK_PAID",
      userId: actorId,
      before,
      after: payout
    }, tx);
    await writeSecurityLog({
      action: "APPROVE_OR_PAY_DESIGNER_BONUS_PAYOUT",
      userId: actorId,
      entityType: "DESIGNER_BONUS_PAYOUT",
      entityId: id,
      client: tx
    });
    await markLinkedAccrualsPaid(payout.linkedAccrualIds, actorId, tx);

    return payout;
  });
}

export async function createAdjustment(
  data: Pick<DesignerBonusAdjustment, "designerId" | "amount" | "adjustmentType" | "reason" | "comment">,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.designerBonusAdjustment.create({
      data: {
        designerId: data.designerId,
        amount: data.amount,
        adjustmentType: data.adjustmentType,
        reason: data.reason,
        comment: data.comment ?? null,
        createdById: actorId,
        approvedById: actorId,
        approvedAt: new Date()
      }
    });

    await writeAuditLog({
      entityType: "DESIGNER_BONUS_ADJUSTMENT",
      entityId: adjustment.id,
      action: "CREATE",
      userId: actorId,
      after: adjustment
    }, tx);
    await writeSecurityLog({
      action: "CREATE_DESIGNER_BONUS_ADJUSTMENT",
      userId: actorId,
      entityType: "DESIGNER_BONUS_ADJUSTMENT",
      entityId: adjustment.id,
      client: tx
    });

    return adjustment;
  });
}
