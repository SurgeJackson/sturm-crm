import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  title,
  children,
  contentClassName
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function SummaryBreakdownCard({
  title,
  data,
  emptyText = "Данных пока нет.",
  labelFor = (key) => key,
  valueVariant = "secondary",
  contentClassName
}: {
  title: string;
  data: Record<string, number>;
  emptyText?: string;
  labelFor?: (key: string) => ReactNode;
  valueVariant?: BadgeProps["variant"];
  contentClassName?: string;
}) {
  const entries = Object.entries(data);

  return (
    <SummaryCard title={title} contentClassName={cn("space-y-2", contentClassName)}>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : entries.map(([key, count]) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
          <span className="min-w-0">{labelFor(key)}</span>
          <Badge className="shrink-0" variant={valueVariant}>{count}</Badge>
        </div>
      ))}
    </SummaryCard>
  );
}

export function SummaryValueListCard<T>({
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
    <SummaryCard title={title} contentClassName={cn("space-y-2", contentClassName)}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : items.map((item) => {
        const content = (
          <>
            <span className="min-w-0">{renderLabel(item)}</span>
            <Badge className="shrink-0" variant={valueVariant}>{renderValue(item)}</Badge>
          </>
        );
        const className = cn(
          "flex items-center justify-between gap-3 rounded-md border p-3 text-sm",
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
      })}
    </SummaryCard>
  );
}
