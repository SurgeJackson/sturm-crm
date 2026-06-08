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
  DESIGNER_BONUS_ADJUSTMENT: "Корректировка бонуса дизайнера",
  EMPLOYEE_PROFILE: "Профиль сотрудника",
  WORK_LOCATION: "Рабочая точка",
  WORK_SHIFT: "Смена",
  EMPLOYEE_TRUSTED_DEVICE: "Устройство сотрудника",
  LOCATION_DISPLAY_DEVICE: "QR-экран точки",
  LOCATION_DISPLAY_SETUP_TOKEN: "Setup token QR-экрана",
  LOCATION_DISPLAY_SESSION: "Display-сессия",
  QR_TOKEN: "QR-токен",
  TIME_EVENT: "Отметка времени",
  TIMESHEET_DAY: "День табеля",
  TIME_ADJUSTMENT_REQUEST: "Заявка на корректировку времени"
};
