import type { Client, Deal, Designer, ProjectObject, User } from "@/generated/prisma/client";
import {
  DateField,
  FormField,
  SelectField,
  TextField,
  dateInputValue
} from "@/components/crm/form-fields";
import { ResponsibleField } from "@/components/crm/responsible-field";
import { Input } from "@/components/ui/input";
import {
  dealLossReasonOptions,
  dealProbabilityOptions,
  dealSourceOptions,
  dealStageOptions
} from "@/modules/crm/options";
import type { DealActionState } from "@/modules/deals/actions";

export type DealObjectOption = Pick<ProjectObject, "id" | "title" | "clientId" | "designerId"> & {
  client: Pick<Client, "id" | "name">;
  designer: Pick<Designer, "id" | "name" | "studio"> | null;
};

export function DealRelationFields({
  state,
  title,
  setTitle,
  objectId,
  onObjectChange,
  objects,
  clientId,
  setClientId,
  clients,
  designerId,
  setDesignerId,
  designers,
  users,
  responsibleId,
  canChangeResponsible
}: {
  state: DealActionState;
  title: string;
  setTitle: (value: string) => void;
  objectId: string;
  onObjectChange: (value: string) => void;
  objects: DealObjectOption[];
  clientId: string;
  setClientId: (value: string) => void;
  clients: Pick<Client, "id" | "name">[];
  designerId: string;
  setDesignerId: (value: string) => void;
  designers: Pick<Designer, "id" | "name" | "studio">[];
  users: Pick<User, "id" | "name" | "email">[];
  responsibleId: string;
  canChangeResponsible: boolean;
}) {
  return (
    <>
      <FormField name="title" label="Название сделки *" state={state}>
        <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </FormField>
      <SelectField
        name="objectId"
        label="Объект *"
        state={state}
        value={objectId}
        onChange={(event) => onObjectChange(event.target.value)}
        placeholder="Выберите объект"
        required
      >
        {objects.map((object) => (
          <option key={object.id} value={object.id}>
            {object.title}
          </option>
        ))}
      </SelectField>
      <SelectField
        name="clientId"
        label="Клиент *"
        state={state}
        value={clientId}
        onChange={(event) => setClientId(event.target.value)}
        placeholder="Выберите клиента"
        required
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        name="designerId"
        label="Дизайнер / архитектор"
        value={designerId}
        onChange={(event) => setDesignerId(event.target.value)}
        placeholder="Не выбран"
      >
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>
            {designer.name}
            {designer.studio ? `, ${designer.studio}` : ""}
          </option>
        ))}
      </SelectField>
      <ResponsibleField
        users={users}
        responsibleId={responsibleId}
        canChangeResponsible={canChangeResponsible}
        state={state}
      />
    </>
  );
}

export function DealPipelineFields({
  state,
  deal,
  stage,
  setStage,
  defaultSource,
  isClosedStage
}: {
  state: DealActionState;
  deal?: Deal;
  stage: Deal["stage"];
  setStage: (value: Deal["stage"]) => void;
  defaultSource: string;
  isClosedStage: boolean;
}) {
  return (
    <>
      <SelectField
        name="stage"
        label="Стадия *"
        state={state}
        value={stage}
        onChange={(event) => setStage(event.target.value as Deal["stage"])}
        options={dealStageOptions}
      />
      <TextField name="potentialAmount" label="Потенциальная сумма" inputMode="decimal" defaultValue={deal?.potentialAmount ?? ""} />
      <SelectField name="probability" label="Вероятность" defaultValue={deal?.probability ?? ""} placeholder="Не выбрана" options={dealProbabilityOptions} />
      <SelectField name="source" label="Источник *" defaultValue={defaultSource} options={dealSourceOptions} state={state} />
      <DateField name="nextActionAt" label={`Дата следующего действия ${!isClosedStage ? "*" : ""}`} defaultValue={dateInputValue(deal?.nextActionAt)} disabled={isClosedStage} state={state} />
      <TextField name="nextActionText" label={`Следующий шаг ${!isClosedStage ? "*" : ""}`} defaultValue={deal?.nextActionText ?? ""} disabled={isClosedStage} state={state} className="md:col-span-2" />
      {stage === "LOST" ? (
        <>
          <SelectField name="lossReason" label="Причина проигрыша *" defaultValue={deal?.lossReason ?? ""} placeholder="Выберите причину" options={dealLossReasonOptions} state={state} />
          <TextField name="lossComment" label="Комментарий к проигрышу" defaultValue={deal?.lossComment ?? ""} />
        </>
      ) : null}
    </>
  );
}
