import { describe, expect, it } from "vitest";
import { roleLabels } from "../lib/constants";
import { enumParam, flagParam, upperEnumParam } from "../modules/crm/param-parsing";
import { namedAmountRows, namedCountRows, uniqueIds } from "../modules/dashboard/utils";
import { isFrozenObjectTransition } from "../modules/objects/service";
import type { TaskActivity } from "../generated/prisma/client";
import { automaticTaskCreateData, automaticTaskDedupeWhere } from "../modules/tasks/automatic-tasks";
import { nextStepTaskCreateData } from "../modules/tasks/next-step-service";
import { buildEmployeeActivityRows } from "../modules/reports/activity";

describe("query parameter parsing", () => {
  it("returns only allowed enum values", () => {
    expect(enumParam("OWNER", roleLabels)).toBe("OWNER");
    expect(enumParam("BAD_ROLE", roleLabels)).toBeUndefined();
    expect(upperEnumParam("owner", roleLabels)).toBe("OWNER");
    expect(flagParam("1")).toBe(true);
    expect(flagParam("true")).toBe(false);
  });
});

describe("object workflow helpers", () => {
  it("detects the first transition into frozen state or stage", () => {
    expect(isFrozenObjectTransition({ status: "ACTIVE", stage: "CALCULATION" }, { status: "FROZEN", stage: "CALCULATION" })).toBe(true);
    expect(isFrozenObjectTransition({ status: "ACTIVE", stage: "CALCULATION" }, { status: "ACTIVE", stage: "FROZEN" })).toBe(true);
    expect(isFrozenObjectTransition({ status: "FROZEN", stage: "CALCULATION" }, { status: "FROZEN", stage: "FROZEN" })).toBe(false);
  });
});

describe("automatic task helpers", () => {
  it("builds a dedupe query with undefined optional relation filters", () => {
    expect(automaticTaskDedupeWhere({
      title: "Follow up",
      responsibleId: "user-1",
      createdById: "admin-1",
      dueAt: new Date("2026-01-01T00:00:00.000Z"),
      autoRule: "CLIENT_WITHOUT_NEXT_CONTACT",
      clientId: "client-1",
      designerId: null
    })).toMatchObject({
      archivedAt: null,
      autoRule: "CLIENT_WITHOUT_NEXT_CONTACT",
      clientId: "client-1",
      designerId: undefined
    });
  });

  it("builds normalized create data for automatic tasks", () => {
    const dueAt = new Date("2026-01-02T00:00:00.000Z");

    expect(automaticTaskCreateData({
      title: "Связаться по КП КП-2026-0001",
      description: "Follow-up по КП КП-2026-0001",
      notes: "Follow-up по КП КП-2026-0001",
      responsibleId: "manager-1",
      createdById: "creator-1",
      dueAt,
      autoRule: "PROPOSAL_FOLLOW_UP",
      priority: "HIGH",
      clientId: "client-1",
      designerId: null,
      objectId: "object-1",
      dealId: "deal-1",
      proposalId: "proposal-1"
    })).toMatchObject({
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: "Связаться по КП КП-2026-0001",
      description: "Follow-up по КП КП-2026-0001",
      responsibleId: "manager-1",
      createdById: "creator-1",
      dueAt,
      status: "NEW",
      priority: "HIGH",
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      clientId: "client-1",
      designerId: null,
      objectId: "object-1",
      dealId: "deal-1",
      proposalId: "proposal-1",
      notes: "Follow-up по КП КП-2026-0001"
    });
  });
});

describe("next-step task helpers", () => {
  it("links a generated next-step task to its source task", () => {
    const dueAt = new Date("2026-01-03T09:00:00.000Z");
    const source = {
      id: "task-1",
      recordType: "TOUCH",
      title: "Первичный звонок",
      responsibleId: "manager-1",
      clientId: "client-1",
      designerId: null,
      objectId: null,
      dealId: "deal-1",
      proposalId: null,
      objectParticipantId: null,
      priority: "HIGH",
      nextStepText: "Отправить подборку",
      nextStepAt: dueAt
    } as TaskActivity;

    expect(nextStepTaskCreateData(source, "creator-1")).toMatchObject({
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: "Отправить подборку",
      description: "Следующий шаг после касания: Первичный звонок",
      responsibleId: "manager-1",
      createdById: "creator-1",
      clientId: "client-1",
      dealId: "deal-1",
      nextStepSourceTaskId: "task-1",
      status: "NEW",
      priority: "HIGH",
      dueAt
    });
  });
});

describe("activity report helpers", () => {
  it("builds employee rows from precomputed metric maps", () => {
    const rows = buildEmployeeActivityRows(
      [{ id: "user-1", name: "Manager", email: "m@example.com", role: "STORE_MANAGER" }],
      {
        clients: new Map([["user-1", 2]]),
        designers: new Map(),
        objects: new Map(),
        deals: new Map([["user-1", 1]]),
        proposals: new Map(),
        proposalAmount: new Map([["user-1", 150000]]),
        tasks: new Map([["user-1", 4]]),
        doneTasks: new Map([["user-1", 3]]),
        overdueTasks: new Map(),
        touches: new Map(),
        calls: new Map(),
        meetings: new Map(),
        email: new Map(),
        messengers: new Map(),
        followUps: new Map(),
        presentations: new Map(),
        outsideMeetings: new Map()
      }
    );

    expect(rows[0]).toMatchObject({
      clients: 2,
      deals: 1,
      proposalAmount: 150000,
      tasks: 4,
      doneTasks: 3,
      overdueTasks: 0
    });
  });
});

describe("dashboard aggregation helpers", () => {
  it("deduplicates non-empty user ids", () => {
    expect(uniqueIds(["user-1", null, "user-2", "user-1", undefined])).toEqual(["user-1", "user-2"]);
  });

  it("maps count rows to sorted named rows", () => {
    expect(namedCountRows(
      [
        { responsibleId: "user-1", _count: { _all: 2 } },
        { responsibleId: "missing", _count: { _all: 5 } }
      ],
      new Map([["user-1", "Manager"]])
    )).toEqual([
      { name: "Не назначен", count: 5 },
      { name: "Manager", count: 2 }
    ]);
  });

  it("maps amount rows to sorted named rows", () => {
    expect(namedAmountRows(
      [
        { responsibleId: "user-1", value: 100 },
        { responsibleId: "user-2", value: 250 }
      ],
      new Map([["user-1", "Manager"], ["user-2", "Lead"]]),
      (row) => row.value
    )).toEqual([
      { name: "Lead", amount: 250 },
      { name: "Manager", amount: 100 }
    ]);
  });
});
