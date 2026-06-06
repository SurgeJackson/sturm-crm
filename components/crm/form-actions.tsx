import { Button } from "@/components/ui/button";

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
