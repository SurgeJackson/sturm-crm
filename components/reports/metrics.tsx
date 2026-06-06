import { MetricCard } from "@/components/crm/summary-card";
import type { Metric } from "@/modules/reports/queries";

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          badgeLabel="CRM"
          badgeVariant={metric.tone ?? "outline"}
        />
      ))}
    </div>
  );
}
