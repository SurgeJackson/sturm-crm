import type { EntityStatus } from "@/generated/prisma/client";

export const entityStatusLabels: Record<EntityStatus, string> = {
  ACTIVE: "Активно",
  ARCHIVED: "В архиве",
  LOST: "Потеряно",
  SLEEPING: "Спит"
};
