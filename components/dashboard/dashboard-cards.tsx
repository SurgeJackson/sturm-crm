import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { MetricCard, SummaryBreakdownCard } from "@/components/crm/summary-card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { BorderedListItem } from "@/components/ui/bordered-list-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardMetric = {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  variant: BadgeProps["variant"];
};

export function DashboardMetricGrid({ cards }: { cards: DashboardMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        return (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            badgeLabel="CRM"
            badgeVariant={card.variant}
          />
        );
      })}
    </div>
  );
}

export function DashboardListCard<T>({
  title,
  items,
  emptyText,
  getKey,
  renderItem,
  contentClassName
}: {
  title: string;
  items: T[];
  emptyText: string;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
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
          items.map((item) => <div key={getKey(item)}>{renderItem(item)}</div>)
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardListItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <BorderedListItem className={className}>{children}</BorderedListItem>;
}

export function DashboardStatRow({
  label,
  value,
  variant = "secondary"
}: {
  label: ReactNode;
  value: ReactNode;
  variant?: BadgeProps["variant"];
}) {
  return (
    <DashboardListItem className="flex items-center justify-between gap-3">
      <span className="min-w-0">{label}</span>
      <Badge className="shrink-0" variant={variant}>{value}</Badge>
    </DashboardListItem>
  );
}

export function DashboardBreakdownCard({
  title,
  data,
  emptyText,
  labelFor,
  variant = "secondary",
  contentClassName
}: {
  title: string;
  data: Record<string, number>;
  emptyText: string;
  labelFor: (key: string) => ReactNode;
  variant?: BadgeProps["variant"];
  contentClassName?: string;
}) {
  return (
    <SummaryBreakdownCard
      title={title}
      data={data}
      emptyText={emptyText}
      labelFor={labelFor}
      valueVariant={variant}
      contentClassName={contentClassName}
    />
  );
}
