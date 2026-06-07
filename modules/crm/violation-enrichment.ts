import type { AuditEntityType } from "@/generated/prisma/client";
import { computeBonusEligibilityStatus } from "@/modules/crm-discipline/bonus";
import { getActiveViolationsMap } from "@/modules/crm-discipline/queries";

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
