import type { Dispatch, SetStateAction } from "react";
import type { TaskActivity } from "@/generated/prisma/client";
import {
  FormSection,
  SelectField,
  TextareaField,
  TextField
} from "@/components/crm/form-fields";
import { ResponsibleField } from "@/components/crm/responsible-field";
import type { TaskActionState } from "@/modules/tasks/actions";
import {
  taskActionTypeOptions,
  taskPriorityOptions,
  taskRecordTypeOptions,
  taskStatusOptions
} from "@/modules/crm/options";
import type { TaskFormDefaults } from "@/components/tasks/task-activity-form";
import { dateTimeValue, defaultDueAt } from "@/components/tasks/task-form-utils";

type UserOption = { id: string; name: string; email: string };

export function TaskMainFields({
  state,
  task,
  defaults,
  users,
  recordType,
  setRecordType,
  responsibleId,
  setResponsibleId,
  canChangeResponsible
}: {
  state: TaskActionState;
  task?: TaskActivity;
  defaults?: TaskFormDefaults;
  users: UserOption[];
  recordType: string;
  setRecordType: Dispatch<SetStateAction<string>>;
  responsibleId: string;
  setResponsibleId: Dispatch<SetStateAction<string>>;
  canChangeResponsible: boolean;
}) {
  const defaultTitle = task?.title ?? defaults?.title ?? (recordType === "TOUCH" ? "Касание" : "");
  const defaultStatus = task?.status ?? (recordType === "TOUCH" ? "RECORDED" : "NEW");

  return (
    <FormSection title="Основная запись" description="Тип, действие, ответственный и срок выполнения.">
      <SelectField
        name="recordType"
        label="Тип записи *"
        value={recordType}
        onChange={(event) => setRecordType(event.target.value)}
        options={taskRecordTypeOptions}
      />
      <SelectField
        name="actionType"
        label="Вид действия *"
        state={state}
        options={taskActionTypeOptions}
        defaultValue={task?.actionType ?? defaults?.actionType ?? "CALL"}
      />
      <TextField name="title" label="Название *" state={state} className="md:col-span-2" defaultValue={defaultTitle} required />
      <ResponsibleField
        users={users}
        responsibleId={responsibleId}
        canChangeResponsible={canChangeResponsible}
        state={state}
        onChange={setResponsibleId}
      />
      <SelectField name="priority" label="Приоритет" options={taskPriorityOptions} defaultValue={task?.priority ?? "NORMAL"} />
      <SelectField name="status" label="Статус" options={taskStatusOptions} defaultValue={defaultStatus} />
      <TextField
        name="dueAt"
        label={recordType === "TOUCH" ? "Дата касания *" : "Срок *"}
        state={state}
        type="datetime-local"
        defaultValue={dateTimeValue(task?.dueAt) || defaultDueAt(recordType)}
      />
      <TextareaField
        name="description"
        label="Описание"
        className="md:col-span-2"
        defaultValue={task?.description ?? ""}
        rows={3}
      />
    </FormSection>
  );
}
