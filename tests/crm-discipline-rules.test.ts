import { describe, expect, it } from "vitest";
import {
  validateClientForDiscipline,
  validateDealForDiscipline,
  validateDesignerForDiscipline,
  validateObjectForDiscipline,
  validateProposalForDiscipline,
  validateTaskForDiscipline
} from "../modules/crm-discipline/rules";

function codes<T extends { code: string }>(violations: T[]) {
  return violations.map((violation) => violation.code).sort();
}

describe("crm discipline rules", () => {
  it("detects missing client qualification fields", () => {
    expect(
      codes(
        validateClientForDiscipline({
          id: "client-1",
          status: "ACTIVE"
        })
      )
    ).toEqual([
      "CLIENT_ACTIVE_NO_NEXT_CONTACT",
      "CLIENT_NO_CONTACT",
      "CLIENT_NO_RESPONSIBLE",
      "CLIENT_NO_SOURCE"
    ]);
  });

  it("detects stale and incomplete designer records", () => {
    const staleDate = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000);
    const oldContactDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    expect(
      codes(
        validateDesignerForDiscipline({
          id: "designer-1",
          messenger: "@designer",
          responsibleId: "user-1",
          relationshipStage: "NEW_CONTACT",
          firstContactAt: oldContactDate,
          lastTouchAt: staleDate
        })
      )
    ).toEqual([
      "DESIGNER_NEW_TOO_LONG",
      "DESIGNER_NO_LOYALTY",
      "DESIGNER_NO_NEXT_STEP",
      "DESIGNER_NO_POTENTIAL",
      "DESIGNER_NO_TOUCH_60_DAYS"
    ]);
  });

  it("requires active objects and frozen objects to have follow-up tasks", () => {
    expect(
      codes(
        validateObjectForDiscipline({
          id: "object-1",
          clientId: "client-1",
          responsibleId: "user-1",
          status: "ACTIVE",
          stage: "SELECTION",
          tasks: []
        })
      )
    ).toEqual(["OBJECT_ACTIVE_NO_TASK"]);

    expect(
      codes(
        validateObjectForDiscipline({
          id: "object-2",
          clientId: "client-1",
          responsibleId: "user-1",
          status: "FROZEN",
          stage: "FROZEN",
          tasks: [{ status: "OPEN", autoRule: "FROZEN_OBJECT_RETURN" }]
        })
      )
    ).toEqual([]);
  });

  it("checks active and lost deal discipline", () => {
    expect(
      codes(
        validateDealForDiscipline({
          id: "deal-1",
          clientId: "client-1",
          objectId: "object-1",
          responsibleId: "user-1",
          stage: "QUALIFICATION",
          potentialAmount: 1000
        })
      )
    ).toEqual(["DEAL_NO_NEXT_ACTION_DATE", "DEAL_NO_NEXT_STEP"]);

    expect(
      codes(
        validateDealForDiscipline({
          id: "deal-2",
          clientId: "client-1",
          objectId: "object-1",
          responsibleId: "user-1",
          stage: "LOST",
          potentialAmount: 1000
        })
      )
    ).toEqual(["DEAL_LOST_NO_REASON"]);
  });

  it("checks proposal file, amount and follow-up requirements", () => {
    expect(
      codes(
        validateProposalForDiscipline({
          id: "proposal-1",
          dealId: "deal-1",
          responsibleId: "user-1",
          status: "SENT",
          amount: 0
        })
      )
    ).toEqual(["PROPOSAL_NO_AMOUNT", "PROPOSAL_NO_FILE_SENT", "PROPOSAL_NO_FOLLOW_UP"]);
  });

  it("checks task deadlines and result requirements", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(
      codes(
        validateTaskForDiscipline({
          id: "task-1",
          recordType: "TASK",
          responsibleId: "user-1",
          status: "OPEN",
          dueAt: yesterday
        })
      )
    ).toEqual(["TASK_OVERDUE"]);

    expect(
      codes(
        validateTaskForDiscipline({
          id: "task-2",
          recordType: "TASK",
          responsibleId: "user-1",
          status: "DONE",
          dueAt: yesterday
        })
      )
    ).toEqual(["TASK_DONE_NO_RESULT"]);

    expect(
      codes(
        validateTaskForDiscipline({
          id: "touch-1",
          recordType: "TOUCH",
          responsibleId: "user-1"
        })
      )
    ).toEqual(["TOUCH_NO_RESULT"]);
  });

  it("uses an injected clock for overdue rules and detected time", () => {
    const now = new Date("2026-06-06T12:00:00.000Z");
    const violations = validateTaskForDiscipline(
      {
        id: "task-clock",
        recordType: "TASK",
        responsibleId: "user-1",
        status: "OPEN",
        dueAt: new Date("2026-06-06T11:59:59.000Z")
      },
      { now }
    );

    expect(codes(violations)).toEqual(["TASK_OVERDUE"]);
    expect(violations[0].createdAt).toBe(now);
  });
});
