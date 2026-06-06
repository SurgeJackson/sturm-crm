import type { ClientSource, ClientStatus, ClientType } from "@/generated/prisma/client";

export const clientTypeLabels: Record<ClientType, string> = {
  INDIVIDUAL: "Физическое лицо",
  LEGAL_ENTITY: "Юридическое лицо",
  COMPANY_REPRESENTATIVE: "Представитель компании",
  DESIGNER_FOR_SELF: "Дизайнер для себя",
  CUSTOMER_REPRESENTATIVE: "Представитель заказчика"
};

export const clientSourceLabels: Record<ClientSource, string> = {
  SHOWROOM: "Шоурум",
  WEBSITE: "Сайт",
  PHONE: "Звонок",
  DESIGNER: "Дизайнер",
  RECOMMENDATION: "Рекомендация",
  EXHIBITION: "Выставка",
  SOCIAL_MEDIA: "Соцсети",
  OTHER: "Другое"
};

export const clientStatusLabels: Record<ClientStatus, string> = {
  NEW: "Новый",
  ACTIVE: "Активный",
  SLEEPING: "Спящий",
  REGULAR: "Постоянный",
  LOST: "Потерянный",
  ARCHIVED: "Архивный"
};
