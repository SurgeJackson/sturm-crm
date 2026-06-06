import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
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

export function CompactMetricCard({
  title,
  value,
  description
}: {
  title: string;
  value: ReactNode;
  description?: ReactNode;
}) {
  return <MetricCard title={title} value={value} description={description} valueSize="compact" />;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  badgeLabel,
  badgeVariant = "outline",
  valueSize = "default"
}: {
  title: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  badgeLabel?: ReactNode;
  badgeVariant?: BadgeProps["variant"];
  valueSize?: "compact" | "default";
}) {
  return (
    <Card>
      <CardHeader className={cn("pb-3", Icon ? "flex flex-row items-center justify-between space-y-0" : undefined)}>
        <CardTitle className={cn("text-sm font-medium", valueSize === "compact" ? "text-muted-foreground" : undefined)}>
          {title}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className={cn("font-semibold tabular-nums", valueSize === "compact" ? "text-2xl" : "text-3xl")}>{value}</div>
        {description ? <div className="mt-1 text-xs text-muted-foreground">{description}</div> : null}
        {badgeLabel ? <Badge className="mt-3" variant={badgeVariant}>{badgeLabel}</Badge> : null}
      </CardContent>
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
