import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

export async function seedDesignerBonuses(prisma: PrismaClient, now: Date) {
  const agreement = await prisma.designerBonusAgreement.upsert({
    where: { id: "seed_bonus_agreement_north" },
    update: {
      designerId: "seed_designer_north",
      agreementType: "STANDARD_PERCENT",
      bonusPercent: 5,
      calculationBase: "PAYMENT_AMOUNT",
      appliesTo: "ALL_DEALS",
      specificDealIds: [],
      validFrom: offsetDate(now, -30),
      validTo: null,
      status: "ACTIVE",
      requiresApproval: false,
      comment: "Seed-договор для проверки бонусов дизайнеров",
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -30),
      archivedAt: null
    },
    create: {
      id: "seed_bonus_agreement_north",
      designerId: "seed_designer_north",
      agreementType: "STANDARD_PERCENT",
      bonusPercent: 5,
      calculationBase: "PAYMENT_AMOUNT",
      appliesTo: "ALL_DEALS",
      specificDealIds: [],
      validFrom: offsetDate(now, -30),
      validTo: null,
      status: "ACTIVE",
      requiresApproval: false,
      comment: "Seed-договор для проверки бонусов дизайнеров",
      createdById: "seed_owner",
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -30),
      archivedAt: null
    }
  });

  await prisma.payment.upsert({
    where: { id: "seed_payment_apartments_prepayment" },
    update: {
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      amount: 500000,
      paymentDate: offsetDate(now, -5),
      paymentType: "PREPAYMENT",
      status: "CONFIRMED",
      source: "MANUAL",
      comment: "Seed-оплата для проверки автоматического начисления бонуса",
      confirmedById: "seed_owner",
      confirmedAt: offsetDate(now, -5),
      archivedAt: null
    },
    create: {
      id: "seed_payment_apartments_prepayment",
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      amount: 500000,
      paymentDate: offsetDate(now, -5),
      paymentType: "PREPAYMENT",
      status: "CONFIRMED",
      source: "MANUAL",
      comment: "Seed-оплата для проверки автоматического начисления бонуса",
      createdById: "seed_owner",
      confirmedById: "seed_owner",
      confirmedAt: offsetDate(now, -5),
      archivedAt: null
    }
  });

  await prisma.designerBonusAccrual.upsert({
    where: {
      designerId_paymentId_accrualType: {
        designerId: "seed_designer_north",
        paymentId: "seed_payment_apartments_prepayment",
        accrualType: "AUTO_FROM_PAYMENT"
      }
    },
    update: {
      agreementId: agreement.id,
      dealId: "seed_deal_apartments_sanitary",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      baseAmount: 500000,
      bonusPercent: 5,
      bonusAmount: 25000,
      accrualDate: offsetDate(now, -5),
      status: "ACCRUED",
      comment: "Seed-начисление по подтвержденной оплате",
      archivedAt: null
    },
    create: {
      id: "seed_bonus_accrual_apartments_prepayment",
      designerId: "seed_designer_north",
      agreementId: agreement.id,
      paymentId: "seed_payment_apartments_prepayment",
      dealId: "seed_deal_apartments_sanitary",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      baseAmount: 500000,
      bonusPercent: 5,
      bonusAmount: 25000,
      accrualDate: offsetDate(now, -5),
      status: "ACCRUED",
      accrualType: "AUTO_FROM_PAYMENT",
      comment: "Seed-начисление по подтвержденной оплате",
      createdById: "seed_owner",
      archivedAt: null
    }
  });

  await prisma.designerBonusPayout.upsert({
    where: { id: "seed_bonus_payout_north" },
    update: {
      designerId: "seed_designer_north",
      amount: 10000,
      payoutDate: offsetDate(now, -2),
      payoutMethod: "BANK_TRANSFER",
      status: "PAID",
      linkedAccrualIds: ["seed_bonus_accrual_apartments_prepayment"],
      comment: "Seed-выплата части бонуса",
      documentFileUrl: null,
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -2),
      paidById: "seed_owner",
      paidAt: offsetDate(now, -2),
      archivedAt: null
    },
    create: {
      id: "seed_bonus_payout_north",
      designerId: "seed_designer_north",
      amount: 10000,
      payoutDate: offsetDate(now, -2),
      payoutMethod: "BANK_TRANSFER",
      status: "PAID",
      linkedAccrualIds: ["seed_bonus_accrual_apartments_prepayment"],
      comment: "Seed-выплата части бонуса",
      documentFileUrl: null,
      createdById: "seed_owner",
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -2),
      paidById: "seed_owner",
      paidAt: offsetDate(now, -2),
      archivedAt: null
    }
  });

  await prisma.designerBonusAdjustment.upsert({
    where: { id: "seed_bonus_adjustment_north" },
    update: {
      designerId: "seed_designer_north",
      amount: 1500,
      adjustmentType: "ADDITIONAL_ACCRUAL",
      reason: "Seed-корректировка взаиморасчетов",
      comment: "Добавлена для проверки баланса дизайнера",
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -1),
      archivedAt: null
    },
    create: {
      id: "seed_bonus_adjustment_north",
      designerId: "seed_designer_north",
      amount: 1500,
      adjustmentType: "ADDITIONAL_ACCRUAL",
      reason: "Seed-корректировка взаиморасчетов",
      comment: "Добавлена для проверки баланса дизайнера",
      createdById: "seed_owner",
      approvedById: "seed_owner",
      approvedAt: offsetDate(now, -1),
      archivedAt: null
    }
  });
}
