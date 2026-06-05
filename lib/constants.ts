import type {
  AuditEntityType,
  AttitudeToSturm,
  ChangeApproval,
  ClientSource,
  ClientStatus,
  ClientType,
  DealLossReason,
  DealProbability,
  DealSource,
  DealStage,
  DesignerLoyalty,
  DesignerPotential,
  DesignerProjectSegment,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  DesignerSpecialization,
  EntityStatus,
  InfluenceLevel,
  InfluenceType,
  ObjectInterestCategory,
  ObjectStage,
  ObjectStatus,
  ObjectType,
  ProjectObjectParticipantType,
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

export const objectTypeLabels: Record<ObjectType, string> = {
  APARTMENT: "Квартира",
  PRIVATE_HOUSE: "Частный дом",
  APARTMENTS_COMPLEX: "Апартаменты",
  HOTEL: "Гостиница",
  APART_HOTEL: "Апарт-отель",
  RESTAURANT: "Ресторан",
  OFFICE: "Офис",
  MEDICAL: "Медицинский объект",
  FITNESS_POOL: "Фитнес / бассейн",
  RESIDENTIAL_COMPLEX: "ЖК",
  COMMERCIAL: "Коммерческий объект",
  OTHER: "Другое"
};

export const objectInterestCategoryLabels: Record<ObjectInterestCategory, string> = {
  SANITARY_WARE: "Сантехника",
  MIXERS: "Смесители",
  SHOWER_SYSTEMS: "Душевые системы",
  BATHROOM_FURNITURE: "Мебель для ванной",
  ACCESSORIES: "Аксессуары",
  TILES: "Плитка",
  MIRRORS: "Зеркала",
  COMMERCIAL_SANITARY: "Общественные санузлы",
  OTHER: "Другое"
};

export const objectStageLabels: Record<ObjectStage, string> = {
  NEW_OBJECT: "Новый объект",
  INFO_COLLECTION: "Сбор информации",
  DESIGN_STAGE: "Проектирование",
  CALCULATION: "Расчет",
  APPROVAL: "Согласование",
  PURCHASE: "Закупка",
  DELIVERY_IMPLEMENTATION: "Поставка / реализация",
  COMPLETED: "Завершен",
  FROZEN: "Заморожен",
  LOST: "Потерян"
};

export const objectStatusLabels: Record<ObjectStatus, string> = {
  ACTIVE: "Активный",
  FROZEN: "Заморожен",
  COMPLETED: "Завершен",
  LOST: "Потерян",
  ARCHIVED: "Архивный"
};

export const projectObjectParticipantTypeLabels: Record<ProjectObjectParticipantType, string> = {
  PURCHASE_INFLUENCER: "Влияет на решение о закупке",
  IMPLEMENTATION_CONTACT: "Контактное лицо реализации"
};

export const influenceLevelLabels: Record<InfluenceLevel, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий"
};

export const influenceTypeLabels: Record<InfluenceType, string> = {
  BUDGET: "Бюджет",
  BRAND: "Бренд",
  FINAL_DECISION: "Финальное решение",
  TECHNICAL_SOLUTION: "Техническое решение",
  DEADLINES: "Сроки",
  PAYMENT_TERMS: "Условия оплаты",
  SUPPLIER_CHOICE: "Выбор поставщика",
  OTHER: "Другое"
};

export const attitudeToSturmLabels: Record<AttitudeToSturm, string> = {
  LOYAL: "Лоялен",
  NEUTRAL: "Нейтрален",
  AGAINST: "Против",
  UNKNOWN: "Неизвестно"
};

export const changeApprovalLabels: Record<ChangeApproval, string> = {
  YES: "Да",
  NO: "Нет",
  PARTIALLY: "Частично"
};

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
