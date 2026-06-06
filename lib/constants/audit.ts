import type { AuditEntityType } from "@/generated/prisma/client";

export const auditEntityTypeLabels: Record<AuditEntityType, string> = {
  CLIENT: "Клиент",
  DESIGNER: "Дизайнер",
  OBJECT: "Объект",
  DEAL: "Сделка",
  PROPOSAL: "КП",
  TASK: "Задача",
  USER: "Пользователь",
  CRM_VIOLATION: "Нарушение CRM"
};
