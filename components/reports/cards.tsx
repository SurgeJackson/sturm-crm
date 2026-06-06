import type { ReactNode } from "react";
import type { BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryBreakdownCard, SummaryValueListCard } from "@/components/crm/summary-card";

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
  return <SummaryBreakdownCard title={title} data={data} />;
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
    <SummaryValueListCard
      title={title}
      items={items}
      emptyText={emptyText}
      getKey={getKey}
      renderLabel={renderLabel}
      renderValue={renderValue}
      valueVariant={valueVariant}
      hrefFor={hrefFor}
      contentClassName={contentClassName}
    />
  );
}
