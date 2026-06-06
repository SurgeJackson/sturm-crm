import type { TaskActionType, TaskAutoRule, TaskPriority, TaskRecordType, TaskStatus } from "@/generated/prisma/client";

export const taskStatusLabels: Record<TaskStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидание",
  DONE: "Выполнена",
  OVERDUE: "Просрочена",
  CANCELLED: "Отменена",
  RECORDED: "Зафиксировано",
  NEEDS_NEXT_STEP: "Нужен следующий шаг",
  CLOSED: "Закрыто"
};

export const taskRecordTypeLabels: Record<TaskRecordType, string> = {
  TASK: "Задача",
  TOUCH: "Касание"
};

export const taskActionTypeLabels: Record<TaskActionType, string> = {
  CALL: "Звонок",
  INCOMING_CALL: "Входящий звонок",
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
  EMAIL: "Email",
  SHOWROOM_MEETING: "Встреча в шоуруме",
  OUTSIDE_MEETING: "Выездная встреча",
  PRESENTATION: "Презентация",
  PROPOSAL_SENT: "Отправка КП",
  FOLLOW_UP: "Follow-up",
  REQUEST_PLANS: "Запрос планов",
  TERMS_APPROVAL: "Согласование условий",
  SHOWROOM_INVITE: "Приглашение в шоурум",
  EVENT_INVITE: "Приглашение на мероприятие",
  INTERNAL_TASK: "Внутренняя задача",
  OTHER: "Другое"
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Низкий",
  NORMAL: "Обычный",
  HIGH: "Высокий",
  URGENT: "Срочный"
};

export const taskAutoRuleLabels: Record<TaskAutoRule, string> = {
  PROPOSAL_FOLLOW_UP: "Follow-up после КП",
  DESIGNER_REACTIVATION: "Реактивация дизайнера",
  FROZEN_OBJECT_RETURN: "Возврат к замороженному объекту",
  DEAL_WITHOUT_NEXT_STEP: "Сделка без следующего шага",
  CLIENT_WITHOUT_NEXT_CONTACT: "Клиент без следующего контакта",
  OTHER: "Другое"
};
