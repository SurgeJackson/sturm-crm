import type {
  DesignerBonusAccrualStatus,
  DesignerBonusAccrualType,
  DesignerBonusAdjustmentType,
  DesignerBonusAgreementStatus,
  DesignerBonusAgreementType,
  DesignerBonusAppliesTo,
  DesignerBonusCalculationBase,
  DesignerBonusPayoutMethod,
  DesignerBonusPayoutStatus,
  PaymentSource,
  PaymentStatus,
  PaymentType
} from "@/generated/prisma/client";

export const designerBonusAgreementTypeLabels: Record<DesignerBonusAgreementType, string> = {
  STANDARD_PERCENT: "Стандартный процент",
  INDIVIDUAL_PERCENT: "Индивидуальный процент",
  FIXED_AMOUNT: "Фиксированная сумма",
  MANUAL_ONLY: "Только вручную",
  NO_BONUS: "Без бонуса"
};

export const designerBonusCalculationBaseLabels: Record<DesignerBonusCalculationBase, string> = {
  PAYMENT_AMOUNT: "От суммы оплаты",
  DEAL_AMOUNT: "От суммы сделки",
  PROPOSAL_AMOUNT: "От суммы КП",
  MARGIN: "От маржи",
  MANUAL: "Вручную"
};

export const designerBonusAppliesToLabels: Record<DesignerBonusAppliesTo, string> = {
  ALL_DEALS: "Все сделки дизайнера",
  SPECIFIC_OBJECTS: "Отдельные объекты",
  SPECIFIC_DEALS: "Отдельные сделки",
  MANUAL_SELECTION: "Ручной выбор"
};

export const designerBonusAgreementStatusLabels: Record<DesignerBonusAgreementStatus, string> = {
  DRAFT: "Черновик",
  ACTIVE: "Активно",
  PAUSED: "Приостановлено",
  ENDED: "Завершено",
  ARCHIVED: "Архив"
};

export const paymentTypeLabels: Record<PaymentType, string> = {
  PREPAYMENT: "Предоплата",
  PARTIAL_PAYMENT: "Частичная оплата",
  FINAL_PAYMENT: "Финальная оплата",
  REFUND: "Возврат",
  CORRECTION: "Корректировка"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  DRAFT: "Черновик",
  CONFIRMED: "Подтверждена",
  CANCELLED: "Отменена"
};

export const paymentSourceLabels: Record<PaymentSource, string> = {
  MANUAL: "Вручную",
  IMPORT: "Импорт",
  ACCOUNTING: "Бухгалтерия",
  BANK_IMPORT: "Банковская выписка"
};

export const designerBonusAccrualTypeLabels: Record<DesignerBonusAccrualType, string> = {
  AUTO_FROM_PAYMENT: "Авто от оплаты",
  MANUAL: "Ручное начисление",
  CORRECTION: "Корректировка",
  REFUND_REVERSAL: "Сторно возврата"
};

export const designerBonusAccrualStatusLabels: Record<DesignerBonusAccrualStatus, string> = {
  DRAFT: "Черновик",
  ACCRUED: "Начислено",
  APPROVED: "Подтверждено",
  CANCELLED: "Отменено",
  PAID: "Выплачено",
  REVERSED: "Сторнировано"
};

export const designerBonusPayoutMethodLabels: Record<DesignerBonusPayoutMethod, string> = {
  CASH: "Наличные",
  BANK_TRANSFER: "Банковский перевод",
  CARD_TRANSFER: "Перевод на карту",
  OFFSET: "Взаимозачет",
  OTHER: "Другое"
};

export const designerBonusPayoutStatusLabels: Record<DesignerBonusPayoutStatus, string> = {
  DRAFT: "Черновик",
  APPROVED: "Согласовано",
  PAID: "Выплачено",
  CANCELLED: "Отменено"
};

export const designerBonusAdjustmentTypeLabels: Record<DesignerBonusAdjustmentType, string> = {
  ADDITIONAL_ACCRUAL: "Дополнительное начисление",
  WRITE_OFF: "Списание",
  CORRECTION_PLUS: "Корректировка в плюс",
  CORRECTION_MINUS: "Корректировка в минус",
  OTHER: "Другое"
};
