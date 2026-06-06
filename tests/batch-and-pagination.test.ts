import { describe, expect, it } from "vitest";
import { processCursorBatches } from "../modules/crm-discipline/batch-runner";
import { pageFromParam, paginatedResult } from "../modules/crm/pagination";

describe("cursor batch runner", () => {
  it("processes cursor batches and aggregates totals", async () => {
    const rows = [
      { id: "a", created: 1 },
      { id: "b", created: 2 },
      { id: "c", created: 3 }
    ];

    const result = await processCursorBatches(
      async (cursorId) => {
        const start = cursorId ? rows.findIndex((row) => row.id === cursorId) + 1 : 0;
        return rows.slice(start, start + 2);
      },
      async (row) => ({
        created: row.created,
        resolved: 1,
        active: 2
      })
    );

    expect(result).toEqual({
      checked: 3,
      created: 6,
      resolved: 3,
      active: 6
    });
  });
});

describe("pagination helpers", () => {
  it("normalizes invalid pages and builds pagination metadata", () => {
    expect(pageFromParam("0")).toBe(1);
    expect(pageFromParam("abc")).toBe(1);
    expect(pageFromParam("3")).toBe(3);

    expect(paginatedResult(["a", "b"], 21, 2, 10)).toEqual({
      items: ["a", "b"],
      total: 21,
      page: 2,
      pageSize: 10,
      pageCount: 3
    });
  });
});
