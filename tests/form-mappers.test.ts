import { describe, expect, it } from "vitest";
import { parseDealForm, toDealDocument } from "../modules/deals/form";
import { parseObjectForm, toObjectDocument } from "../modules/objects/form";
import { safeProposalFileName } from "../modules/proposals/files";
import { ensureSentRequirements, parseProposalForm, toProposalDocument } from "../modules/proposals/form";
import { parseTaskForm, toTaskDocument } from "../modules/tasks/form";

describe("crm form mappers", () => {
  it("maps object forms to prisma documents", () => {
    const form = new FormData();
    form.set("title", "Object");
    form.set("objectType", "APARTMENT");
    form.set("city", "Moscow");
    form.set("clientId", "client-1");
    form.set("responsibleId", "user-1");
    form.set("stage", "CALCULATION");
    form.set("status", "ACTIVE");
    form.set("budget", "10,5");
    form.set("bathroomsCount", "2");
    form.append("interestCategories", "MIXERS");
    form.append("interestCategories", "TILES");
    form.set("files", "plan.pdf\nspec.xlsx");

    const parsed = parseObjectForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const document = toObjectDocument(parsed.data, "user-2");
    expect(document).toMatchObject({
      title: "Object",
      responsibleId: "user-2",
      budget: 10.5,
      bathroomsCount: 2,
      files: ["plan.pdf", "spec.xlsx"]
    });
  });

  it("maps proposal forms and validates sent requirements", () => {
    const form = new FormData();
    form.set("dealId", "deal-1");
    form.set("responsibleId", "user-1");
    form.set("amount", "1000,5");
    form.set("status", "SENT");
    form.set("recipientType", "CLIENT");
    form.set("recipientName", "Client");
    form.set("sentAt", "2026-06-06");
    form.set("nextTouchAt", "2026-06-07");

    const parsed = parseProposalForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const document = toProposalDocument(
      parsed.data,
      { clientId: "client-1", objectId: "object-1", designerId: null, responsibleId: "user-1" },
      "user-2",
      null,
      {
        fileUrl: "/uploads/proposals/test.pdf",
        fileName: "test.pdf",
        fileSize: 1,
        fileMimeType: "application/pdf",
        uploadedById: "user-2",
        uploadedAt: new Date("2026-06-06T00:00:00.000Z")
      }
    );

    expect(document.amount).toBe(1000.5);
    expect(document.responsibleId).toBe("user-2");
    expect(ensureSentRequirements(document.status, document.fileUrl, parsed.data)).toBeNull();
    expect(ensureSentRequirements(document.status, null, parsed.data)).toBe("Прикрепите файл КП перед отправкой");
  });

  it("maps deal forms to prisma documents", () => {
    const form = new FormData();
    form.set("title", "Deal");
    form.set("clientId", "client-ignored");
    form.set("objectId", "object-1");
    form.set("responsibleId", "user-1");
    form.set("stage", "QUALIFICATION");
    form.set("potentialAmount", "2500,75");
    form.set("probability", "HIGH");
    form.set("nextActionAt", "2026-06-07");
    form.set("nextActionText", "Call client");
    form.set("source", "SHOWROOM");

    const parsed = parseDealForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const document = toDealDocument(
      parsed.data,
      { clientId: "client-1", designerId: "designer-1" },
      "user-2"
    );

    expect(document).toMatchObject({
      title: "Deal",
      clientId: "client-1",
      designerId: "designer-1",
      responsibleId: "user-2",
      potentialAmount: 2500.75,
      probability: "HIGH",
      nextActionText: "Call client",
      closedAt: null
    });
  });

  it("maps task forms and normalizes touch status", () => {
    const form = new FormData();
    form.set("recordType", "TOUCH");
    form.set("actionType", "CALL");
    form.set("title", "Touch");
    form.set("responsibleId", "user-1");
    form.set("clientId", "client-1");
    form.set("status", "NEW");
    form.set("priority", "NORMAL");
    form.set("dueAt", "2026-06-06T10:00");
    form.set("result", "Reached client");

    const parsed = parseTaskForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const document = toTaskDocument(parsed.data, {
      clientId: "client-1",
      designerId: null,
      objectId: null,
      dealId: null,
      proposalId: null,
      objectParticipantId: null
    });

    expect(document).toMatchObject({
      recordType: "TOUCH",
      actionType: "CALL",
      responsibleId: "user-1",
      clientId: "client-1",
      status: "RECORDED",
      result: "Reached client"
    });
    expect(document.completedAt).toEqual(document.dueAt);
  });

  it("sanitizes proposal upload file names", () => {
    expect(safeProposalFileName("My КП !!.PDF")).toMatch(/^[0-9a-f-]{36}-My-КП-\.pdf$/);
  });
});
