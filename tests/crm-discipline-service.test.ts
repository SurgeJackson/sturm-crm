import { describe, expect, it } from "vitest";
import {
  computeBonusEligibilityStatus,
  crmDisciplineStatus,
  crmEntityHref
} from "../modules/crm-discipline/service";

describe("crm discipline service helpers", () => {
  it("computes bonus eligibility from active bonus violations", () => {
    expect(computeBonusEligibilityStatus([], true)).toBe("ELIGIBLE");
    expect(computeBonusEligibilityStatus([], false)).toBe("NOT_APPLICABLE");

    expect(
      computeBonusEligibilityStatus([
        { severity: "MEDIUM", canAffectBonus: true, status: "ACTIVE" },
        { severity: "CRITICAL", canAffectBonus: true, status: "RESOLVED" }
      ])
    ).toBe("NEEDS_FIX");

    expect(
      computeBonusEligibilityStatus([
        { severity: "CRITICAL", canAffectBonus: false, status: "ACTIVE" },
        { severity: "LOW", canAffectBonus: true, status: "ACTIVE" }
      ])
    ).toBe("ELIGIBLE");

    expect(
      computeBonusEligibilityStatus([
        {
          code: "DEAL_NO_NEXT_STEP",
          severity: "critical",
          message: "Активная сделка без следующего шага.",
          entityType: "DEAL",
          entityId: "deal-1",
          canAffectBonus: true,
          createdAt: new Date()
        }
      ])
    ).toBe("NOT_ELIGIBLE");
  });

  it("computes crm discipline status from active violations", () => {
    expect(crmDisciplineStatus([])).toBe("correct");
    expect(crmDisciplineStatus([{ severity: "LOW", status: "ACTIVE" }])).toBe("needs_fix");
    expect(crmDisciplineStatus([{ severity: "CRITICAL", status: "ACTIVE" }])).toBe("critical");
    expect(crmDisciplineStatus([{ severity: "CRITICAL", status: "RESOLVED" }])).toBe("correct");
  });

  it("builds crm entity links", () => {
    expect(crmEntityHref("DEAL", "deal-1")).toBe("/deals/deal-1");
    expect(crmEntityHref("CRM_VIOLATION", "violation-1")).toBe("/reports/crm-discipline/violation-1");
  });
});
