import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  total,
  page,
  pageCount,
  previousHref,
  nextHref
}: {
  total: number;
  page: number;
  pageCount: number;
  previousHref?: string;
  nextHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Всего: {total}</span>
      <div className="flex items-center gap-2">
        {previousHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={previousHref}>Назад</Link>
          </Button>
        ) : null}
        <span className="py-2">Страница {page} из {pageCount}</span>
        {nextHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={nextHref}>Вперед</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
