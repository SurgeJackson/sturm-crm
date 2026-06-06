import type { TaskActivity } from "@/generated/prisma/client";
import { FormSection, TextareaField, TextField } from "@/components/crm/form-fields";
import type { TaskActionState } from "@/modules/tasks/actions";
import { dateTimeValue } from "@/components/tasks/task-form-utils";

export function TaskResultFields({
  state,
  task,
  recordType
}: {
  state: TaskActionState;
  task?: TaskActivity;
  recordType: string;
}) {
  return (
    <FormSection>
      <TextareaField
        name="result"
        label={recordType === "TOUCH" ? "Результат касания *" : "Результат выполнения"}
        state={state}
        className="md:col-span-2"
        defaultValue={task?.result ?? ""}
        rows={3}
      />
      <TextField name="nextStepText" label="Текст следующего шага" state={state} defaultValue={task?.nextStepText ?? ""} />
      <TextField
        name="nextStepAt"
        label="Дата следующего шага"
        type="datetime-local"
        defaultValue={dateTimeValue(task?.nextStepAt)}
      />
    </FormSection>
  );
}
