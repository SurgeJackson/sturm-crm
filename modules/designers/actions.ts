"use server";

import { redirect } from "next/navigation";
import type { DesignerRelationshipStage } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canChangeRecordResponsible,
  canCreateDesigner,
  canEditRecord
} from "@/permissions";
import { parseDesignerForm, relationshipStages } from "@/modules/designers/form";
import { getDesignerForMutation } from "@/modules/designers/services/queries";
import { changeDesignerStage } from "@/modules/designers/services/stage";
import { createDesigner, updateDesigner } from "@/modules/designers/services/workflow";

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
  const designer = await createDesigner(parsed.data, responsibleId, user.id);

  redirect(`/designers/${designer.id}?saved=1`);
}

export async function updateDesignerAction(id: string, _prevState: DesignerActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await getDesignerForMutation(id);

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
  await updateDesigner(id, before, parsed.data, responsibleId, user.id);

  redirect(`/designers/${id}?saved=1`);
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

  const before = await getDesignerForMutation(id);

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect("/designers/pipeline?error=permission");
  }

  await changeDesignerStage(id, before, stage as DesignerRelationshipStage, user.id);

  redirect("/designers/pipeline?saved=1");
}
