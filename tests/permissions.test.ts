import { describe, expect, it } from "vitest";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canEditRecord,
  canManageUsers,
  canViewAllData,
  canViewRecord
} from "../permissions";

describe("permissions", () => {
  const owner = { id: "owner", role: "OWNER" as const, isActive: true };
  const salesLead = { id: "lead", role: "SALES_LEAD" as const, isActive: true };
  const projectManager = { id: "pm", role: "PROJECT_MANAGER" as const, isActive: true };
  const administrator = { id: "admin", role: "ADMINISTRATOR" as const, isActive: true };
  const ownRecord = { createdById: "pm", responsibleId: "pm" };
  const foreignRecord = { createdById: "owner", responsibleId: "owner" };

  it("allows leadership to see all data", () => {
    expect(canViewAllData(owner)).toBe(true);
    expect(canViewAllData(salesLead)).toBe(true);
    expect(canViewAllData(projectManager)).toBe(false);
  });

  it("restricts managers to owned or responsible records", () => {
    expect(canViewRecord(projectManager, ownRecord)).toBe(true);
    expect(canEditRecord(projectManager, ownRecord)).toBe(true);
    expect(canViewRecord(projectManager, foreignRecord)).toBe(false);
    expect(canEditRecord(projectManager, foreignRecord)).toBe(false);
  });

  it("keeps archive rights on leadership roles only", () => {
    expect(canArchiveRecord(owner, foreignRecord)).toBe(true);
    expect(canArchiveRecord(salesLead, foreignRecord)).toBe(true);
    expect(canArchiveRecord(projectManager, ownRecord)).toBe(false);
    expect(canArchiveRecord(administrator, ownRecord)).toBe(false);
  });

  it("allows elevated roles to manage users and responsible assignment", () => {
    expect(canManageUsers(owner)).toBe(true);
    expect(canManageUsers(administrator)).toBe(true);
    expect(canChangeRecordResponsible(salesLead)).toBe(true);
    expect(canChangeRecordResponsible(projectManager)).toBe(false);
  });
});
