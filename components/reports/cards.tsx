import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
