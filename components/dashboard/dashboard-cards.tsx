import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SummaryBreakdownCard } from "@/components/crm/summary-card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
              <Badge className="mt-3" variant={card.variant}>
                CRM
              </Badge>
            </CardContent>
          </Card>
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
