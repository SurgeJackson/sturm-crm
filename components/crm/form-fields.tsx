import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type FormState = {
  errors?: Record<string, string[] | undefined>;
};

export function dateInputValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function FieldError({ name, state }: { name: string; state: FormState }) {
  const message = state.errors?.[name]?.[0];
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
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
