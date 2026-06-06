import type { DealLossReason, DealProbability, DealSource, DealStage } from "@/generated/prisma/client";

export const dealStageLabels: Record<DealStage, string> = {
  NEW_REQUEST: "Новый запрос",
  QUALIFICATION: "Квалификация",
  SELECTION: "Подбор",
  PROPOSAL_IN_PROGRESS: "КП в работе",
  PROPOSAL_SENT: "КП отправлено",
  WAITING_DECISION: "Ожидание решения",
  NEGOTIATION: "Согласование",
  INVOICE_OR_ORDER: "Счет / заказ",
  PAID: "Оплачено",
  IN_DELIVERY: "В поставке",
  COMPLETED: "Завершено",
  LOST: "Проиграно"
};

export const dealProbabilityLabels: Record<DealProbability, string> = {
  LOW: "Низкая",
  MEDIUM: "Средняя",
  HIGH: "Высокая",
  VERY_HIGH: "Очень высокая"
};

export const dealProbabilityPercent: Record<DealProbability, number> = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  VERY_HIGH: 90
};

export const dealSourceLabels: Record<DealSource, string> = {
  DESIGNER: "Дизайнер",
  SHOWROOM: "Шоурум",
  WEBSITE: "Сайт",
  PHONE: "Звонок",
  RECOMMENDATION: "Рекомендация",
  REPEAT_CLIENT: "Повторный клиент",
  COMMERCIAL_PROJECT: "Коммерческий проект",
  OTHER: "Другое"
};

export const dealLossReasonLabels: Record<DealLossReason, string> = {
  PRICE: "Цена",
  DEADLINES: "Сроки",
  COMPETITOR: "Конкурент",
  CHINA: "Купили в Китае",
  SELF_PURCHASE: "Купили самостоятельно",
  CLIENT_DISAPPEARED: "Клиент пропал",
  ASSORTMENT: "Не подошел ассортимент",
  PAYMENT_TERMS: "Не подошли условия оплаты",
  DELIVERY_TERMS: "Не подошли сроки поставки",
  DESIGNER_NOT_SUPPORT: "Дизайнер не поддержал",
  PROCUREMENT_CHOSE_OTHER: "Закупщик выбрал другого",
  PROJECT_FROZEN: "Проект заморожен",
  OTHER: "Другое"
};
