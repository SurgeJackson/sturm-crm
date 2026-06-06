import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FormActions({
  isPending,
  submitLabel,
  cancelHref,
  cancelLabel = "Отменить"
}: {
  isPending: boolean;
  submitLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap gap-3 border-t bg-background/95 px-5 py-4 backdrop-blur sm:mx-0 sm:rounded-md sm:border sm:p-3">
      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохранение..." : submitLabel}
      </Button>
      {cancelHref ? (
        <Button asChild variant="outline">
          <Link href={cancelHref}>{cancelLabel}</Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          {cancelLabel}
        </Button>
      )}
    </div>
  );
}
