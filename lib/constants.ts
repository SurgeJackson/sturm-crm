import type { AuditEntityType, EntityStatus, TaskStatus, UserRole } from "@prisma/client";

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
