import { describe, expect, it } from "vitest";
import { parseObjectForm, toObjectDocument } from "../modules/objects/form";
import { ensureSentRequirements, parseProposalForm, toProposalDocument } from "../modules/proposals/form";

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
});
