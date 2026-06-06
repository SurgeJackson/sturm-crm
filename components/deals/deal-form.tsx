"use client";

import { useActionState, useMemo, useState } from "react";
import type { Client, Deal, Designer, User } from "@/generated/prisma/client";
import {
  FormMessage,
  FormSection,
  TextareaField
} from "@/components/crm/form-fields";
import { FormActions } from "@/components/crm/form-actions";
import {
  DealPipelineFields,
  DealRelationFields,
  type DealObjectOption
} from "@/components/deals/deal-form-sections";
import type { DealActionState } from "@/modules/deals/actions";

type DealFormProps = {
  action: (state: DealActionState, formData: FormData) => Promise<DealActionState>;
  deal?: Deal;
  users: Pick<User, "id" | "name" | "email">[];
  clients: Pick<Client, "id" | "name">[];
  objects: DealObjectOption[];
  designers: Pick<Designer, "id" | "name" | "studio">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  preselectedObjectId?: string;
  submitLabel: string;
};

const initialState: DealActionState = {};

export function DealForm({
  action,
  deal,
  users,
  clients,
  objects,
  designers,
  currentUserId,
  canChangeResponsible,
  preselectedObjectId,
  submitLabel
}: DealFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const initialObjectId = deal?.objectId ?? preselectedObjectId ?? "";
  const initialObject = objects.find((object) => object.id === initialObjectId);
  const [title, setTitle] = useState(deal?.title ?? (initialObject ? `Сделка по объекту ${initialObject.title}` : ""));
  const [objectId, setObjectId] = useState(initialObjectId);
  const [clientId, setClientId] = useState(deal?.clientId ?? initialObject?.clientId ?? "");
  const [designerId, setDesignerId] = useState(deal?.designerId ?? initialObject?.designerId ?? "");
  const [stage, setStage] = useState(deal?.stage ?? "NEW_REQUEST");
  const objectById = useMemo(() => new Map(objects.map((object) => [object.id, object])), [objects]);
  const responsibleId = deal?.responsibleId ?? currentUserId;
  const isClosedStage = stage === "LOST" || stage === "COMPLETED";
  const defaultSource = deal?.source ?? (initialObject?.designerId ? "DESIGNER" : "SHOWROOM");

  function onObjectChange(nextObjectId: string) {
    setObjectId(nextObjectId);
    const selected = objectById.get(nextObjectId);
    if (!selected) return;

    setClientId(selected.clientId);
    setDesignerId(selected.designerId ?? "");
    if (!title.trim() || title.startsWith("Сделка по объекту ")) {
      setTitle(`Сделка по объекту ${selected.title}`);
    }
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection title="Связи" description="Сделка должна быть привязана к объекту, клиенту и ответственному.">
        <DealRelationFields
          state={state}
          title={title}
          setTitle={setTitle}
          objectId={objectId}
          onObjectChange={onObjectChange}
          objects={objects}
          clientId={clientId}
          setClientId={setClientId}
          clients={clients}
          designerId={designerId}
          setDesignerId={setDesignerId}
          designers={designers}
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
        />
      </FormSection>

      <FormSection title="Воронка и следующий шаг" description="Стадия, вероятность, сумма и плановое действие по сделке.">
        <DealPipelineFields
          state={state}
          deal={deal}
          stage={stage}
          setStage={setStage}
          defaultSource={defaultSource}
          isClosedStage={isClosedStage}
        />
      </FormSection>

      <FormSection title="Комментарий" columns={1}>
        <TextareaField name="comment" label="Комментарий" defaultValue={deal?.comment ?? ""} />
      </FormSection>

      <FormActions
        isPending={isPending}
        submitLabel={submitLabel}
        cancelHref={deal ? `/deals/${deal.id}` : "/deals"}
      />
    </form>
  );
}
