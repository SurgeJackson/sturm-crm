import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metric } from "@/modules/reports/queries";

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metric.value}</div>
            <Badge className="mt-3" variant={metric.tone ?? "outline"}>
              CRM
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
