import type { CommercialProposalStatus, ProposalDeclineReason, RecipientType } from "@/generated/prisma/client";

export const commercialProposalStatusLabels: Record<CommercialProposalStatus, string> = {
  DRAFT: "Черновик",
  INTERNAL_REVIEW: "На проверке",
  SENT: "Отправлено",
  CLIENT_THINKING: "Клиент думает",
  NEEDS_RECALCULATION: "Требуется пересчет",
  NEW_VERSION_CREATED: "Новая версия создана",
  ACCEPTED: "Принято",
  DECLINED: "Отклонено",
  ARCHIVED: "Архив"
};

export const recipientTypeLabels: Record<RecipientType, string> = {
  CLIENT: "Клиент",
  DESIGNER: "Дизайнер",
  PURCHASE_INFLUENCER: "Влияющий на закупку",
  IMPLEMENTATION_CONTACT: "Контактное лицо реализации",
  OTHER: "Другое"
};

export const proposalDeclineReasonLabels: Record<ProposalDeclineReason, string> = {
  PRICE: "Цена",
  DEADLINES: "Сроки",
  ASSORTMENT: "Ассортимент",
  COMPETITOR: "Конкурент",
  CHINA: "Купили в Китае",
  SELF_PURCHASE: "Купили самостоятельно",
  PROJECT_FROZEN: "Проект заморожен",
  CLIENT_DISAPPEARED: "Клиент пропал",
  DESIGNER_NOT_SUPPORT: "Дизайнер не поддержал",
  PROCUREMENT_CHOSE_OTHER: "Закупщик выбрал другого",
  OTHER: "Другое"
};
