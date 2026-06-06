"use server";

import { redirect } from "next/navigation";
import type { DesignerRelationshipStage } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canCreateDesigner,
  canEditRecord
} from "@/permissions";
import { writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncDesignerDiscipline } from "@/modules/crm-discipline/service";
import { parseDesignerForm, relationshipStages, toDesignerDocument } from "@/modules/designers/form";

export type DesignerActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createDesignerAction(_prevState: DesignerActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateDesigner(user)) {
    return { message: "Недостаточно прав для создания дизайнера" };
  }

  const parsed = parseDesignerForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user) ? parsed.data.responsibleId : user.id;
  const document = {
    ...toDesignerDocument(parsed.data, responsibleId),
    transferredObjectsCount: 0,
    activeObjectsCount: 0,
    proposalsTotalAmount: 0,
    paymentsTotalAmount: 0,
    createdById: user.id,
    archivedAt: null
  };

  const designer = await prisma.designer.create({
    data: document
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: designer.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(designer)
  });

  await syncDesignerDiscipline(designer.id, user.id);

  redirect(`/designers/${designer.id}?saved=1`);
}

export async function updateDesignerAction(id: string, _prevState: DesignerActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    return { message: "Недостаточно прав для редактирования дизайнера" };
  }

  const parsed = parseDesignerForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user)
    ? parsed.data.responsibleId
    : before.responsibleId;
  const update = {
    ...toDesignerDocument(parsed.data, responsibleId)
  };

  const after = await prisma.designer.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  const trackedFields = [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, responsibleId],
    ["relationshipStage", "CHANGE_RELATIONSHIP_STAGE", before.relationshipStage, parsed.data.relationshipStage],
    ["potential", "CHANGE_POTENTIAL", before.potential, parsed.data.potential],
    ["loyalty", "CHANGE_LOYALTY", before.loyalty, parsed.data.loyalty],
    ["nextStepText", "CHANGE_NEXT_STEP", before.nextStepText, parsed.data.nextStepText],
    ["nextStepAt", "CHANGE_NEXT_STEP", before.nextStepAt?.toISOString?.(), update.nextStepAt?.toISOString?.()]
  ] as const;

  await writeTrackedFieldAuditLogs({
    entityType: "DESIGNER",
    entityId: id,
    userId: user.id,
    fields: trackedFields
  });

  await syncDesignerDiscipline(id, user.id);

  redirect(`/designers/${id}?saved=1`);
}

export async function archiveDesignerAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canArchiveRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect(`/designers/${id}?error=archive`);
  }

  const update = {
    status: "ARCHIVED" as const,
    archivedAt: new Date(),
    updatedAt: new Date()
  };
  const after = await prisma.designer.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await expireViolationsForEntity("DESIGNER", id, user.id);

  redirect(`/designers/${id}?archived=1`);
}

export async function changeDesignerStageAction(id: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const stage = formData.get("relationshipStage");

  if (!relationshipStages.includes(stage as DesignerRelationshipStage)) {
    redirect("/designers/pipeline?error=stage");
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect("/designers/pipeline?error=permission");
  }

  await prisma.designer.update({
    where: { id },
    data: { relationshipStage: stage as DesignerRelationshipStage }
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "CHANGE_RELATIONSHIP_STAGE",
    userId: user.id,
    before: { relationshipStage: before.relationshipStage },
    after: { relationshipStage: stage }
  });

  redirect("/designers/pipeline?saved=1");
}
