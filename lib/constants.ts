import type {
  AuditEntityType,
  ClientSource,
  ClientStatus,
  ClientType,
  DesignerLoyalty,
  DesignerPotential,
  DesignerProjectSegment,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  DesignerSpecialization,
  EntityStatus,
  TaskStatus,
  UserRole
} from "@prisma/client";

export const roleLabels: Record<UserRole, string> = {
  OWNER: "Руководитель",
  SALES_LEAD: "Старший менеджер",
  STORE_MANAGER: "Менеджер магазина",
  PROJECT_MANAGER: "Проектный менеджер",
  ADMINISTRATOR: "Администратор"
};

export const entityStatusLabels: Record<EntityStatus, string> = {
  ACTIVE: "Активно",
  ARCHIVED: "В архиве",
  LOST: "Потеряно",
  SLEEPING: "Спит"
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидание",
  DONE: "Выполнена",
  OVERDUE: "Просрочена",
  CANCELLED: "Отменена"
};

export const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  CLIENT: "Клиент",
  DESIGNER: "Дизайнер",
  OBJECT: "Объект",
  DEAL: "Сделка",
  PROPOSAL: "КП",
  TASK: "Задача",
  USER: "Пользователь"
};

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

export const designerRoleLabels: Record<DesignerRole, string> = {
  DESIGNER: "Дизайнер",
  ARCHITECT: "Архитектор",
  BUREAU_HEAD: "Руководитель бюро",
  COMPLETER: "Комплектатор",
  DECORATOR: "Декоратор",
  DESIGNER_ASSISTANT: "Помощник дизайнера",
  OTHER: "Другое"
};

export const designerSpecializationLabels: Record<DesignerSpecialization, string> = {
  APARTMENTS: "Квартиры",
  HOUSES: "Дома",
  COMMERCIAL: "Коммерция",
  HORECA: "HoReCa",
  HOTELS: "Отели",
  OFFICES: "Офисы",
  OTHER: "Другое"
};

export const designerProjectSegmentLabels: Record<DesignerProjectSegment, string> = {
  ECONOMY: "Эконом",
  MIDDLE: "Средний",
  MIDDLE_PLUS: "Средний+",
  PREMIUM: "Премиум",
  LUXURY: "Люкс"
};

export const designerSourceLabels: Record<DesignerSource, string> = {
  EXHIBITION: "Выставка",
  RECOMMENDATION: "Рекомендация",
  SOCIAL_MEDIA: "Соцсети",
  INCOMING: "Входящий",
  DATABASE: "База",
  SHOWROOM: "Шоурум",
  EVENT: "Мероприятие",
  OTHER: "Другое"
};

export const designerRelationshipStageLabels: Record<DesignerRelationshipStage, string> = {
  NEW_CONTACT: "Новый контакт",
  FIRST_CONTACT: "Первичный контакт",
  INTERESTED: "Заинтересован",
  INVITED_TO_SHOWROOM: "Приглашен в шоурум",
  MEETING_DONE: "Встреча проведена",
  PRESENTATION_DONE: "Презентация проведена",
  TERMS_DISCUSSING: "Условия обсуждены",
  IN_DEVELOPMENT: "В развитии",
  FIRST_OBJECT_RECEIVED: "Первый объект получен",
  ACTIVE_PARTNER: "Активный партнер",
  KEY_PARTNER: "Ключевой партнер",
  SLEEPING: "Спящий",
  LOST_OR_IRRELEVANT: "Потерян / нецелевой"
};

export const designerPotentialLabels: Record<DesignerPotential, string> = {
  A: "A - высокий потенциал",
  B: "B - перспективный",
  C: "C - слабый / нерегулярный",
  D: "D - нецелевой"
};

export const designerLoyaltyLabels: Record<DesignerLoyalty, string> = {
  COLD: "Холодный",
  NEUTRAL: "Нейтральный",
  WARM: "Теплый",
  LOYAL: "Лояльный",
  AMBASSADOR: "Амбассадор"
};
