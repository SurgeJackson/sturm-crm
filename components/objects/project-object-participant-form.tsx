"use client";

import { useActionState, useState } from "react";
import type { ProjectObjectParticipant, User } from "@/generated/prisma/client";
import {
  FormMessage,
  FormSection,
  SelectField,
  TextareaField,
  TextField
} from "@/components/crm/form-fields";
import { FormActions } from "@/components/crm/form-actions";
import type { ProjectObjectParticipantActionState } from "@/modules/objects/actions";
import {
  attitudeToSturmOptions,
  changeApprovalOptions,
  influenceLevelOptions,
  influenceTypeOptions,
  projectObjectParticipantTypeOptions
} from "@/modules/crm/options";

type ProjectObjectParticipantFormProps = {
  action: (
    state: ProjectObjectParticipantActionState,
    formData: FormData
  ) => Promise<ProjectObjectParticipantActionState>;
  participant?: ProjectObjectParticipant;
  defaultParticipantType?: ProjectObjectParticipant["participantType"];
  users: Pick<User, "id" | "name" | "email">[];
  currentUserId: string;
  objectId: string;
  submitLabel: string;
};

const initialState: ProjectObjectParticipantActionState = {};

export function ProjectObjectParticipantForm({
  action,
  participant,
  defaultParticipantType = "PURCHASE_INFLUENCER",
  users,
  currentUserId,
  objectId,
  submitLabel
}: ProjectObjectParticipantFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [participantType, setParticipantType] = useState(participant?.participantType ?? defaultParticipantType);
  const responsibleId = participant?.responsibleId ?? currentUserId;
  const isInfluencer = participantType === "PURCHASE_INFLUENCER";

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection title="Контакт" description="Кто участвует в объекте и как с ним связаться.">
        <SelectField
          name="participantType"
          label="Тип участника *"
          state={state}
          options={projectObjectParticipantTypeOptions}
          value={participantType}
          onChange={(event) => setParticipantType(event.target.value as typeof participantType)}
        />
        <TextField name="fullName" label="ФИО *" state={state} defaultValue={participant?.fullName ?? ""} required />
        <TextField name="company" label="Компания" defaultValue={participant?.company ?? ""} />
        <TextField name="role" label="Роль *" state={state} defaultValue={participant?.role ?? ""} required />
        <TextField name="phone" label="Телефон" defaultValue={participant?.phone ?? ""} />
        <TextField name="email" label="Email" state={state} type="email" defaultValue={participant?.email ?? ""} />
        <TextField name="messenger" label="Мессенджер" defaultValue={participant?.messenger ?? ""} />
        <SelectField name="responsibleId" label="Ответственный" placeholder="Не выбран" defaultValue={responsibleId}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title={isInfluencer ? "Влияние на покупку" : "Реализация"} description={isInfluencer ? "Факторы принятия решения и отношение к STURM." : "Зона ответственности и правила подключения к изменениям."}>
        {isInfluencer ? (
          <>
            <SelectField
              name="influenceLevel"
              label="Уровень влияния *"
              state={state}
              options={influenceLevelOptions}
              placeholder="Выберите уровень"
              defaultValue={participant?.influenceLevel ?? ""}
            />
            <SelectField
              name="influenceType"
              label="Тип влияния *"
              state={state}
              options={influenceTypeOptions}
              placeholder="Выберите тип"
              defaultValue={participant?.influenceType ?? ""}
            />
            <SelectField
              name="attitudeToSturm"
              label="Отношение к STURM"
              options={attitudeToSturmOptions}
              defaultValue={participant?.attitudeToSturm ?? "UNKNOWN"}
            />
            <TextField name="decisionFactors" label="Что важно" defaultValue={participant?.decisionFactors ?? ""} />
          </>
        ) : (
          <>
            <TextField
              name="responsibilityZone"
              label="Зона ответственности *"
              state={state}
              defaultValue={participant?.responsibilityZone ?? ""}
            />
            <SelectField
              name="canApproveChanges"
              label="Может согласовывать изменения *"
              state={state}
              options={changeApprovalOptions}
              placeholder="Выберите вариант"
              defaultValue={participant?.canApproveChanges ?? ""}
            />
            <TextField
              name="whenToInvolve"
              label="Когда подключать"
              className="md:col-span-2"
              defaultValue={participant?.whenToInvolve ?? ""}
            />
          </>
        )}
      </FormSection>

      <FormSection title="Комментарий" columns={1}>
        <TextareaField name="comment" label="Комментарий" defaultValue={participant?.comment ?? ""} />
      </FormSection>

      <FormActions
        isPending={isPending}
        submitLabel={submitLabel}
        cancelHref={`/objects/${objectId}`}
        cancelLabel="К объекту"
      />
    </form>
  );
}
