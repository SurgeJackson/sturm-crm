import type { AuditEntityType } from "@/generated/prisma/client";
import { computeBonusEligibilityStatus, getActiveViolationsMap } from "@/modules/crm-discipline/service";

export async function withCrmViolations<T extends { id: string }>(
  entityType: AuditEntityType,
  rows: T[],
  appliesToBonus = true
) {
  const violations = await getActiveViolationsMap(entityType, rows.map((item) => item.id));
  return rows.map((item) => {
    const crmViolations = violations.get(item.id) ?? [];
    return {
      ...item,
      crmViolations,
      bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, appliesToBonus)
    };
  });
}
