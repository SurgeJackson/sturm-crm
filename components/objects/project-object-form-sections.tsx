import type { Client, Designer, ProjectObject, User } from "@/generated/prisma/client";
import {
  DateField,
  SelectField,
  TextField,
  dateInputValue
} from "@/components/crm/form-fields";
import { ResponsibleField } from "@/components/crm/responsible-field";
import {
  objectStageOptions,
  objectStatusOptions,
  objectTypeOptions
} from "@/modules/crm/options";
import type { ProjectObjectActionState } from "@/modules/objects/actions";

export function ObjectIdentityFields({
  state,
  projectObject
}: {
  state: ProjectObjectActionState;
  projectObject?: ProjectObject;
}) {
  return (
    <>
      <TextField name="title" label="Название объекта *" state={state} defaultValue={projectObject?.title ?? ""} required />
      <SelectField
        name="objectType"
        label="Тип объекта *"
        state={state}
        options={objectTypeOptions}
        defaultValue={projectObject?.objectType ?? "APARTMENT"}
      />
      <TextField name="city" label="Город *" state={state} defaultValue={projectObject?.city ?? ""} required />
      <TextField name="region" label="Регион" defaultValue={projectObject?.region ?? ""} />
      <TextField name="address" label="Адрес" className="md:col-span-2" defaultValue={projectObject?.address ?? ""} />
    </>
  );
}

export function ObjectRelationsFields({
  state,
  projectObject,
  clients,
  designers,
  users,
  responsibleId,
  canChangeResponsible
}: {
  state: ProjectObjectActionState;
  projectObject?: ProjectObject;
  clients: Pick<Client, "id" | "name" | "phone" | "email">[];
  designers: Pick<Designer, "id" | "name" | "studio">[];
  users: Pick<User, "id" | "name" | "email">[];
  responsibleId: string;
  canChangeResponsible: boolean;
}) {
  return (
    <>
      <SelectField
        name="clientId"
        label="Клиент / заказчик *"
        state={state}
        placeholder="Выберите клиента"
        defaultValue={projectObject?.clientId ?? ""}
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
        placeholder="Не выбран"
        defaultValue={projectObject?.designerId ?? ""}
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
        label="Ответственный STURM *"
      />
    </>
  );
}

export function ObjectStatusFields({
  state,
  projectObject
}: {
  state: ProjectObjectActionState;
  projectObject?: ProjectObject;
}) {
  return (
    <>
      <SelectField
        name="stage"
        label="Стадия *"
        state={state}
        options={objectStageOptions}
        defaultValue={projectObject?.stage ?? "NEW_OBJECT"}
      />
      <SelectField
        name="status"
        label="Статус *"
        state={state}
        options={objectStatusOptions}
        defaultValue={projectObject?.status ?? "ACTIVE"}
      />
      <DateField
        name="implementationStartAt"
        label="Начало реализации"
        defaultValue={dateInputValue(projectObject?.implementationStartAt)}
      />
      <DateField
        name="implementationEndAt"
        label="Завершение реализации"
        defaultValue={dateInputValue(projectObject?.implementationEndAt)}
      />
      <TextField name="budget" label="Бюджет" inputMode="decimal" defaultValue={projectObject?.budget ?? ""} />
      <TextField
        name="bathroomsCount"
        label="Количество санузлов"
        type="number"
        min="0"
        defaultValue={projectObject?.bathroomsCount ?? ""}
      />
    </>
  );
}
