import { dashboardMetricCards } from "@/components/dashboard/dashboard-metric-config";
import {
  DashboardBreakdownCard,
  DashboardListCard,
  DashboardListItem,
  DashboardMetricGrid,
  DashboardStatRow
} from "@/components/dashboard/dashboard-cards";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  commercialProposalStatusLabels,
  dealLossReasonLabels,
  dealStageLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  proposalDeclineReasonLabels
} from "@/lib/constants";
import type { getDashboardMetrics } from "@/modules/dashboard/dashboard-metrics";
import { formatMoney } from "@/utils/money";

type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;

export function DashboardLayout({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Рабочий стол" description="Базовые контрольные показатели для руководителя и отдела продаж." />

      <DashboardMetricGrid cards={dashboardMetricCards(metrics)} />

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardListCard
          title="Просроченные задачи по сотрудникам"
          items={metrics.overdueTaskResponsibleCounts}
          emptyText="Просроченных задач нет."
          getKey={(item) => item.name}
          renderItem={(item) => <DashboardStatRow label={item.name} value={item.count} variant="warning" />}
        />

        <DashboardListCard
          title="Активность менеджеров за 7 дней"
          items={metrics.managerActivityCounts}
          emptyText="Активности пока нет."
          getKey={(item) => item.name}
          renderItem={(item) => (
            <DashboardListItem>
              <div className="font-medium">{item.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Задачи: {item.tasks}</Badge>
                <Badge variant="secondary">Выполнено: {item.done}</Badge>
                <Badge variant="outline">Касания: {item.touches}</Badge>
              </div>
            </DashboardListItem>
          )}
        />

        <DashboardBreakdownCard
          title="Сделки по стадиям"
          data={metrics.dealsByStage}
          emptyText="Пока нет сделок."
          labelFor={(stage) => dealStageLabels[stage as keyof typeof dealStageLabels]}
        />

        <DashboardBreakdownCard
          title="Причины проигрышей"
          data={metrics.dealLossReasons}
          emptyText="Пока нет проигранных сделок."
          labelFor={(reason) => dealLossReasonLabels[reason as keyof typeof dealLossReasonLabels]}
          variant="warning"
        />

        <DashboardListCard
          title="Сделки по ответственным"
          items={metrics.dealResponsibleCounts}
          emptyText="Пока нет сделок."
          getKey={(item) => item.name}
          renderItem={(item) => <DashboardStatRow label={item.name} value={item.count} />}
        />
      </div>

      <DashboardBreakdownCard
        title="Активные дизайнеры по этапам"
        data={metrics.activeDesignersByStage}
        emptyText="Пока нет активных дизайнеров."
        labelFor={(stage) => designerRelationshipStageLabels[stage as keyof typeof designerRelationshipStageLabels]}
        contentClassName="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardBreakdownCard
          title="КП по статусам"
          data={metrics.proposalStatusCounts}
          emptyText="Пока нет КП."
          labelFor={(status) => commercialProposalStatusLabels[status as keyof typeof commercialProposalStatusLabels]}
        />
        <DashboardBreakdownCard
          title="Причины отклонения КП"
          data={metrics.proposalDeclineReasonCounts}
          emptyText="Пока нет отклоненных КП."
          labelFor={(reason) => proposalDeclineReasonLabels[reason as keyof typeof proposalDeclineReasonLabels]}
          variant="warning"
        />
        <DashboardListCard
          title="Сумма КП по ответственным"
          items={metrics.proposalResponsibleAmounts}
          emptyText="Пока нет КП."
          getKey={(item) => item.name}
          renderItem={(item) => <DashboardStatRow label={item.name} value={formatMoney(item.amount, "0 ₽")} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardBreakdownCard
          title="Объекты по стадиям"
          data={metrics.objectsByStage}
          emptyText="Пока нет объектов."
          labelFor={(stage) => objectStageLabels[stage as keyof typeof objectStageLabels]}
          contentClassName="grid gap-2 sm:grid-cols-2"
        />

        <DashboardListCard
          title="Топ дизайнеров по объектам"
          items={metrics.topDesignersByObjects}
          emptyText="Пока нет переданных объектов."
          getKey={(designer) => designer.id}
          renderItem={(designer) => (
            <DashboardStatRow
              label={`${designer.name}${designer.studio ? `, ${designer.studio}` : ""}`}
              value={designer.transferredObjectsCount}
            />
          )}
        />
      </div>
    </div>
  );
}
