import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ReportListCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(data).length === 0 ? (
          <p className="text-sm text-muted-foreground">Данных пока нет.</p>
        ) : (
          Object.entries(data).map(([label, count]) => (
            <div key={label} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{label}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ReportValueListCard<T>({
  title,
  items,
  emptyText = "Данных нет.",
  getKey,
  renderLabel,
  renderValue,
  valueVariant = "secondary",
  hrefFor,
  contentClassName
}: {
  title: string;
  items: T[];
  emptyText?: string;
  getKey: (item: T) => string;
  renderLabel: (item: T) => ReactNode;
  renderValue: (item: T) => ReactNode;
  valueVariant?: BadgeProps["variant"];
  hrefFor?: (item: T) => string;
  contentClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2", contentClassName)}>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => {
            const content = (
              <>
                <span>{renderLabel(item)}</span>
                <Badge variant={valueVariant}>{renderValue(item)}</Badge>
              </>
            );
            const className = cn(
              "flex items-center justify-between rounded-md border p-3 text-sm",
              hrefFor ? "hover:border-primary" : undefined
            );
            const href = hrefFor?.(item);

            return href ? (
              <Link key={getKey(item)} href={href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={getKey(item)} className={className}>
                {content}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
