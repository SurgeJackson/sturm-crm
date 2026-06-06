import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export {
  SummaryBreakdownCard as BreakdownCard,
  SummaryValueListCard as ReportValueListCard
} from "@/components/crm/summary-card";

type ReportScoreBadge = {
  label: ReactNode;
  variant?: BadgeProps["variant"];
};

export function ReportScoreGrid<T>({
  items,
  emptyText,
  getKey,
  renderTitle,
  renderValue,
  renderBadges
}: {
  items: T[];
  emptyText: ReactNode;
  getKey: (item: T) => string;
  renderTitle: (item: T) => ReactNode;
  renderValue: (item: T) => ReactNode;
  renderBadges: (item: T) => ReportScoreBadge[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-muted-foreground">{emptyText}</CardContent>
        </Card>
      ) : items.map((item) => (
        <ReportScoreCard
          key={getKey(item)}
          title={renderTitle(item)}
          value={renderValue(item)}
          badges={renderBadges(item)}
        />
      ))}
    </div>
  );
}

function ReportScoreCard({
  title,
  value,
  badges
}: {
  title: ReactNode;
  value: ReactNode;
  badges: ReportScoreBadge[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {badges.map((badge, index) => (
            <Badge key={index} variant={badge.variant ?? "outline"}>{badge.label}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
