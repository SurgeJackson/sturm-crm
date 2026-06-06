import type { ReactNode } from "react";
import { FormField } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

type FormState = {
  errors?: Record<string, string[] | undefined>;
};

type ResponsibleOption = {
  id: string;
  name: string;
};

export function ResponsibleField({
  users,
  responsibleId,
  canChangeResponsible,
  state,
  label = "Ответственный *",
  onChange
}: {
  users: ResponsibleOption[];
  responsibleId: string;
  canChangeResponsible: boolean;
  state?: FormState;
  label?: ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <FormField name="responsibleId" label={label} state={state}>
      {canChangeResponsible ? (
        <NativeSelect
          id="responsibleId"
          name="responsibleId"
          value={onChange ? responsibleId : undefined}
          defaultValue={onChange ? undefined : responsibleId}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </NativeSelect>
      ) : (
        <>
          <Input value={users.find((user) => user.id === responsibleId)?.name ?? "Текущий пользователь"} disabled />
          <input type="hidden" name="responsibleId" value={responsibleId} />
        </>
      )}
    </FormField>
  );
}
