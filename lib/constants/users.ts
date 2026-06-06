import type { UserRole } from "@/generated/prisma/client";

export const roleLabels: Record<UserRole, string> = {
  OWNER: "Руководитель",
  SALES_LEAD: "Старший менеджер",
  STORE_MANAGER: "Менеджер магазина",
  PROJECT_MANAGER: "Проектный менеджер",
  ADMINISTRATOR: "Администратор"
};
