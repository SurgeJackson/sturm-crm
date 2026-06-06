import type {
  DesignerLoyalty,
  DesignerPotential,
  DesignerProjectSegment,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  DesignerSpecialization
} from "@/generated/prisma/client";

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
