import type { PaymentStatus, Prisma, PrismaClient } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { writeSecurityLog } from "@/lib/security-log";
import { createAccrualForConfirmedPayment, cancelPaymentAccruals } from "@/modules/designer-bonuses/service";
import type { PaymentFormData } from "@/modules/payments/form";

type PaymentClient = PrismaClient | Prisma.TransactionClient;

export class PaymentServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

export const paymentDealInclude = {
  client: { select: { id: true, name: true } },
  projectObject: { select: { id: true, title: true } },
  designer: { select: { id: true, name: true } },
  responsible: { select: { id: true, name: true } }
} satisfies Prisma.DealInclude;

export async function getDealForPayment(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: paymentDealInclude
  });
}

export async function createPayment(data: PaymentFormData, actorId: string) {
  const deal = await getDealForPayment(data.dealId);
  if (!deal) throw new PaymentServiceError("Сделка не найдена или недоступна");

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        dealId: deal.id,
        clientId: deal.clientId,
        objectId: deal.objectId,
        designerId: deal.designerId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentType: data.paymentType,
        status: data.status,
        source: "MANUAL",
        comment: data.comment,
        createdById: actorId,
        confirmedById: data.status === "CONFIRMED" ? actorId : null,
        confirmedAt: data.status === "CONFIRMED" ? new Date() : null
      }
    });

    await writeAuditLog({
      entityType: "PAYMENT",
      entityId: payment.id,
      action: "CREATE",
      userId: actorId,
      after: payment
    }, tx);

    if (payment.status === "CONFIRMED") {
      await writeAuditLog({
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "CONFIRM",
        userId: actorId,
        after: payment
      }, tx);
      await writeSecurityLog({
        action: "CONFIRM_PAYMENT",
        userId: actorId,
        entityType: "PAYMENT",
        entityId: payment.id,
        metadata: { source: "CREATE_PAYMENT" },
        client: tx
      });
      await createAccrualForConfirmedPayment(payment, actorId, tx);
    }

    return payment;
  });
}

export async function changePaymentStatus(id: string, status: PaymentStatus, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.payment.findUnique({ where: { id } });
    if (!before) throw new PaymentServiceError("Оплата не найдена");
    if (before.status === status) return before;

    const payment = await tx.payment.update({
      where: { id },
      data: {
        status,
        confirmedById: status === "CONFIRMED" ? actorId : before.confirmedById,
        confirmedAt: status === "CONFIRMED" ? new Date() : before.confirmedAt
      }
    });

    await writeAuditLog({
      entityType: "PAYMENT",
      entityId: payment.id,
      action: status === "CONFIRMED" ? "CONFIRM" : status === "CANCELLED" ? "CANCEL" : "CHANGE_STATUS",
      userId: actorId,
      before,
      after: payment
    }, tx);

    if (status === "CONFIRMED") {
      await createAccrualForConfirmedPayment(payment, actorId, tx);
    }

    if (status === "CANCELLED") {
      await cancelPaymentAccruals(payment.id, actorId, tx);
    }

    await writeSecurityLog({
      action: status === "CONFIRMED" ? "CONFIRM_PAYMENT" : "CHANGE_PAYMENT_STATUS",
      userId: actorId,
      entityType: "PAYMENT",
      entityId: payment.id,
      metadata: { status },
      client: tx
    });

    return payment;
  });
}
