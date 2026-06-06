import { describe, expect, it } from "vitest";
import { roleLabels } from "../lib/constants";
import { enumParam, flagParam, upperEnumParam } from "../modules/crm/param-parsing";
import { isFrozenObjectTransition } from "../modules/objects/service";
import { automaticTaskDedupeWhere } from "../modules/tasks/automatic-tasks";
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
