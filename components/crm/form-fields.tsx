import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FormState = {
  errors?: Record<string, string[] | undefined>;
};

type SelectOption = {
  value: string;
  label: string;
};

export function dateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function FieldError({ name, state }: { name: string; state: FormState }) {
  const message = state.errors?.[name]?.[0];
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function FormMessage({ state }: { state: FormState & { message?: string } }) {
  return state.message ? (
    <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p>
  ) : null;
}

export function FormField({
  name,
  label,
  state,
  children,
  className
}: {
  name: string;
  label: ReactNode;
  state?: FormState;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {state ? <FieldError name={name} state={state} /> : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  state,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
  name: string;
  label: ReactNode;
  state?: FormState;
  className?: string;
}) {
  return (
    <FormField name={name} label={label} state={state} className={className}>
      <Input id={name} name={name} {...props} />
    </FormField>
  );
}

export function DateField({
  name,
  label,
  state,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type"> & {
  name: string;
  label: ReactNode;
  state?: FormState;
  className?: string;
}) {
  return (
    <TextField name={name} label={label} type="date" state={state} className={className} {...props} />
  );
}

export function TextareaField({
  name,
  label,
  state,
  className,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & {
  name: string;
  label: ReactNode;
  state?: FormState;
  className?: string;
}) {
  return (
    <FormField name={name} label={label} state={state} className={className}>
      <Textarea id={name} name={name} {...props} />
    </FormField>
  );
}

export function SelectField({
  name,
  label,
  state,
  options,
  placeholder,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  name: string;
  label: ReactNode;
  state?: FormState;
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField name={name} label={label} state={state} className={className}>
      <NativeSelect id={name} name={name} {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </NativeSelect>
    </FormField>
  );
}

export function CheckboxGroupField({
  name,
  label,
  options,
  selectedValues,
  className
}: {
  name: string;
  label: ReactNode;
  options: SelectOption[];
  selectedValues: Set<string>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selectedValues.has(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function FormSection({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
  return (
    <div className={columns === 1 ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
      {children}
    </div>
  );
}

export function FormActions({ isPending, submitLabel }: { isPending: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-3">
      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохранение..." : submitLabel}
      </Button>
      <Button type="button" variant="outline" onClick={() => window.history.back()}>
        Отменить
      </Button>
    </div>
  );
}
