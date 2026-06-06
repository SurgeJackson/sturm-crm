"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canArchiveRecord,
  canChangeObjectResponsible,
  canCreateObject,
  canEditRecord,
  canManageObjectParticipants
} from "@/permissions";
import {
  parseObjectForm,
  parseParticipantForm
} from "@/modules/objects/form";
import {
  archiveProjectObject,
  createProjectObject,
  getProjectObjectForMutation,
  getProjectObjectWithDesignerForMutation,
  moveDesignerToFirstObjectReceived,
  updateProjectObject,
  validateObjectRelations
} from "@/modules/objects/service";
import {
  archiveProjectObjectParticipant,
  createProjectObjectParticipant,
  getProjectObjectParticipantForMutation,
  updateProjectObjectParticipant
} from "@/modules/objects/participants-service";

export type ProjectObjectActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export type ProjectObjectParticipantActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createProjectObjectAction(_prevState: ProjectObjectActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateObject(user)) {
    return { message: "Недостаточно прав для создания объекта" };
  }

  const parsed = parseObjectForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const relations = await validateObjectRelations(parsed.data);
  if (!relations.ok) return { message: relations.message };

  const responsibleId = canChangeObjectResponsible(user) ? parsed.data.responsibleId : user.id;
  const object = await createProjectObject(parsed.data, responsibleId, user.id);

  redirect(`/objects/${object.id}?saved=1`);
}

export async function updateProjectObjectAction(id: string, _prevState: ProjectObjectActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await getProjectObjectForMutation(id);

  if (!before || !canEditRecord(user, before)) {
    return { message: "Недостаточно прав для редактирования объекта" };
  }

  const parsed = parseObjectForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const relations = await validateObjectRelations(parsed.data);
  if (!relations.ok) return { message: relations.message };

  const responsibleId = canChangeObjectResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  await updateProjectObject(id, before, parsed.data, responsibleId, user.id);

  redirect(`/objects/${id}?saved=1`);
}

export async function archiveProjectObjectAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await getProjectObjectForMutation(id);

  if (!before || !canArchiveRecord(user, before)) {
    redirect(`/objects/${id}?error=archive`);
  }

  await archiveProjectObject(id, before, user.id);

  redirect(`/objects/${id}?archived=1`);
}

export async function createProjectObjectParticipantAction(
  objectId: string,
  _prevState: ProjectObjectParticipantActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const object = await getProjectObjectForMutation(objectId);

  if (!object || !canManageObjectParticipants(user, object)) {
    return { message: "Недостаточно прав для добавления участника" };
  }

  const parsed = parseParticipantForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await createProjectObjectParticipant(objectId, parsed.data, user.id);

  redirect(`/objects/${objectId}?participantSaved=1`);
}

export async function updateProjectObjectParticipantAction(
  objectId: string,
  participantId: string,
  _prevState: ProjectObjectParticipantActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const [object, before] = await Promise.all([
    getProjectObjectForMutation(objectId),
    getProjectObjectParticipantForMutation(participantId)
  ]);

  if (!object || !before || before.objectId !== objectId || !canManageObjectParticipants(user, object)) {
    return { message: "Недостаточно прав для редактирования участника" };
  }

  const parsed = parseParticipantForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await updateProjectObjectParticipant(objectId, participantId, before, parsed.data, user.id);

  redirect(`/objects/${objectId}?participantSaved=1`);
}

export async function archiveProjectObjectParticipantAction(objectId: string, participantId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [object, before] = await Promise.all([
    getProjectObjectForMutation(objectId),
    getProjectObjectParticipantForMutation(participantId)
  ]);

  if (!object || !before || before.objectId !== objectId || !canManageObjectParticipants(user, object)) {
    redirect(`/objects/${objectId}?error=participant`);
  }

  await archiveProjectObjectParticipant(objectId, participantId, before, user.id);

  redirect(`/objects/${objectId}?participantArchived=1`);
}

export async function moveDesignerToFirstObjectReceivedAction(objectId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const object = await getProjectObjectWithDesignerForMutation(objectId);

  if (!object || !object.designer || !canEditRecord(user, object)) {
    redirect(`/objects/${objectId}?error=designerStage`);
  }

  await moveDesignerToFirstObjectReceived(object, user.id);

  redirect(`/objects/${objectId}?designerStage=1`);
}
