"use client";

import { useActionState, useState } from "react";
import type { ProjectObjectParticipant, User } from "@/generated/prisma/client";
import { FieldError, FormActions, FormMessage, FormSection } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
  submitLabel: string;
};

const initialState: ProjectObjectParticipantActionState = {};

export function ProjectObjectParticipantForm({
  action,
  participant,
  defaultParticipantType = "PURCHASE_INFLUENCER",
  users,
  currentUserId,
  submitLabel
}: ProjectObjectParticipantFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [participantType, setParticipantType] = useState(participant?.participantType ?? defaultParticipantType);
  const responsibleId = participant?.responsibleId ?? currentUserId;
  const isInfluencer = participantType === "PURCHASE_INFLUENCER";

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="participantType">Тип участника *</Label>
          <NativeSelect
            id="participantType"
            name="participantType"
            value={participantType}
            onChange={(event) => setParticipantType(event.target.value as typeof participantType)}
          >
            {projectObjectParticipantTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="participantType" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">ФИО *</Label>
          <Input id="fullName" name="fullName" defaultValue={participant?.fullName ?? ""} required />
          <FieldError name="fullName" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Компания</Label>
          <Input id="company" name="company" defaultValue={participant?.company ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Роль *</Label>
          <Input id="role" name="role" defaultValue={participant?.role ?? ""} required />
          <FieldError name="role" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={participant?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={participant?.email ?? ""} />
          <FieldError name="email" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="messenger">Мессенджер</Label>
          <Input id="messenger" name="messenger" defaultValue={participant?.messenger ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный</Label>
          <NativeSelect
            id="responsibleId"
            name="responsibleId"
            defaultValue={responsibleId}
          >
            <option value="">Не выбран</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        {isInfluencer ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="influenceLevel">Уровень влияния *</Label>
              <NativeSelect
                id="influenceLevel"
                name="influenceLevel"
                defaultValue={participant?.influenceLevel ?? ""}
              >
                <option value="">Выберите уровень</option>
                {influenceLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError name="influenceLevel" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="influenceType">Тип влияния *</Label>
              <NativeSelect
                id="influenceType"
                name="influenceType"
                defaultValue={participant?.influenceType ?? ""}
              >
                <option value="">Выберите тип</option>
                {influenceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError name="influenceType" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attitudeToSturm">Отношение к STURM</Label>
              <NativeSelect
                id="attitudeToSturm"
                name="attitudeToSturm"
                defaultValue={participant?.attitudeToSturm ?? "UNKNOWN"}
              >
                {attitudeToSturmOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="decisionFactors">Что важно</Label>
              <Input id="decisionFactors" name="decisionFactors" defaultValue={participant?.decisionFactors ?? ""} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="responsibilityZone">Зона ответственности *</Label>
              <Input id="responsibilityZone" name="responsibilityZone" defaultValue={participant?.responsibilityZone ?? ""} />
              <FieldError name="responsibilityZone" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canApproveChanges">Может согласовывать изменения *</Label>
              <NativeSelect
                id="canApproveChanges"
                name="canApproveChanges"
                defaultValue={participant?.canApproveChanges ?? ""}
              >
                <option value="">Выберите вариант</option>
                {changeApprovalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
              <FieldError name="canApproveChanges" state={state} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="whenToInvolve">Когда подключать</Label>
              <Input id="whenToInvolve" name="whenToInvolve" defaultValue={participant?.whenToInvolve ?? ""} />
            </div>
          </>
        )}
      </FormSection>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" name="comment" defaultValue={participant?.comment ?? ""} />
      </div>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
