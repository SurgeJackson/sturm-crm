import type {
  AttitudeToSturm,
  ChangeApproval,
  InfluenceLevel,
  InfluenceType,
  ObjectInterestCategory,
  ObjectStage,
  ObjectStatus,
  ObjectType,
  ProjectObjectParticipantType
} from "@/generated/prisma/client";

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
