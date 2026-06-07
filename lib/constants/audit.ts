import type { AuditEntityType } from "@/generated/prisma/client";

export const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  CLIENT: "Клиент",
  DESIGNER: "Дизайнер",
  OBJECT: "Объект",
  DEAL: "Сделка",
  PROPOSAL: "КП",
  TASK: "Задача",
  USER: "Пользователь",
  CRM_VIOLATION: "Нарушение CRM",
  PAYMENT: "Оплата",
  DESIGNER_BONUS_AGREEMENT: "Условия бонусов дизайнера",
  DESIGNER_BONUS_ACCRUAL: "Начисление бонуса дизайнеру",
  DESIGNER_BONUS_PAYOUT: "Выплата бонуса дизайнеру",
  DESIGNER_BONUS_ADJUSTMENT: "Корректировка бонуса дизайнера"
};
