import { AlertTriangle, BriefcaseBusiness, Building2, CheckSquare, FileText, UserRound, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  DashboardBreakdownCard,
  DashboardListCard,
  DashboardListItem,
  DashboardMetricGrid,
  DashboardStatRow
} from "@/components/dashboard/dashboard-cards";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard-metrics";
import {
  commercialProposalStatusLabels,
  dealLossReasonLabels,
  dealStageLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  proposalDeclineReasonLabels
} from "@/lib/constants";
import { formatMoney } from "@/utils/money";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const metrics = await getDashboardMetrics(user);
  const cards = [
    { title: "Новые клиенты за 7 дней", value: metrics.newClients, icon: UsersRound, variant: "default" as const },
    { title: "Новые дизайнеры за 7 дней", value: metrics.newDesigners, icon: UsersRound, variant: "secondary" as const },
    { title: "Задачи на сегодня", value: metrics.tasksToday, icon: CheckSquare, variant: "warning" as const },
    { title: "Просроченные задачи", value: metrics.overdueTasks, icon: AlertTriangle, variant: "warning" as const },
    { title: "Задачи без результата", value: metrics.tasksWithoutResult, icon: AlertTriangle, variant: "outline" as const },
    { title: "Выполнено задач за 7 дней", value: metrics.doneTasksPeriod, icon: CheckSquare, variant: "secondary" as const },
    { title: "Касания за 7 дней", value: metrics.touchesPeriod, icon: CheckSquare, variant: "secondary" as const },
    { title: "Мои задачи на сегодня", value: metrics.myTasksToday, icon: CheckSquare, variant: "warning" as const },
    { title: "Мои просроченные задачи", value: metrics.myOverdueTasks, icon: AlertTriangle, variant: "warning" as const },
    { title: "Мои задачи на неделю", value: metrics.myTasksWeek, icon: CheckSquare, variant: "outline" as const },
    { title: "Мои последние касания", value: metrics.myRecentTouches, icon: CheckSquare, variant: "outline" as const },
    { title: "Мои follow-up по КП", value: metrics.myFollowUps, icon: FileText, variant: "outline" as const },
    { title: "Дизайнеры без следующего шага", value: metrics.designersWithoutNextStep, icon: AlertTriangle, variant: "warning" as const },
    { title: "Дизайнеры без касаний 60+ дней", value: metrics.designersWithoutTouch60, icon: UsersRound, variant: "outline" as const },
    { title: "Клиенты без следующего контакта", value: metrics.clientsWithoutNextContact, icon: UsersRound, variant: "outline" as const },
    { title: "Новые объекты за 7 дней", value: metrics.newObjects, icon: Building2, variant: "default" as const },
    { title: "Активные объекты", value: metrics.activeObjects, icon: Building2, variant: "secondary" as const },
    { title: "Замороженные объекты", value: metrics.frozenObjects, icon: AlertTriangle, variant: "warning" as const },
    { title: "Потерянные объекты", value: metrics.lostObjects, icon: AlertTriangle, variant: "warning" as const },
    { title: "Объекты без следующего шага", value: metrics.objectsWithoutNextStep, icon: CheckSquare, variant: "outline" as const },
    { title: "Объекты без ответственного", value: metrics.objectsWithoutResponsible, icon: AlertTriangle, variant: "outline" as const },
    { title: "Объекты без клиента", value: metrics.objectsWithoutClient, icon: AlertTriangle, variant: "outline" as const },
    { title: "Объекты от дизайнеров", value: metrics.objectsFromDesigners, icon: UserRound, variant: "default" as const },
    { title: "Новые сделки за 7 дней", value: metrics.newDeals, icon: BriefcaseBusiness, variant: "default" as const },
    { title: "Активные сделки", value: metrics.activeDeals, icon: BriefcaseBusiness, variant: "secondary" as const },
    { title: "Сумма активных сделок", value: formatMoney(metrics.activeDealsAmount, "0 ₽"), icon: BriefcaseBusiness, variant: "default" as const },
    { title: "Сделки без следующего шага", value: metrics.dealsWithoutNextStep, icon: AlertTriangle, variant: "warning" as const },
    { title: "Просроченные следующие действия", value: metrics.overdueNextActionDeals, icon: AlertTriangle, variant: "warning" as const },
    { title: "Сделки в ожидании решения", value: metrics.waitingDecisionDeals, icon: CheckSquare, variant: "outline" as const },
    { title: "Проигранные за 7 дней", value: metrics.lostDealsPeriod, icon: AlertTriangle, variant: "warning" as const },
    { title: "Мои активные сделки", value: metrics.myActiveDeals, icon: BriefcaseBusiness, variant: "outline" as const },
    { title: "Мои сделки без шага", value: metrics.myDealsWithoutNextStep, icon: AlertTriangle, variant: "outline" as const },
    { title: "Мои просроченные действия", value: metrics.myOverdueNextActionDeals, icon: AlertTriangle, variant: "warning" as const },
    { title: "Мои сделки ждут решения", value: metrics.myWaitingDecisionDeals, icon: CheckSquare, variant: "outline" as const },
    { title: "Мои КП в работе", value: metrics.myProposalInProgressDeals, icon: FileText, variant: "outline" as const },
    { title: "Мои проигранные за 7 дней", value: metrics.myLostDealsPeriod, icon: AlertTriangle, variant: "outline" as const },
    { title: "Новые КП за 7 дней", value: metrics.newProposals, icon: FileText, variant: "default" as const },
    { title: "Сумма новых КП", value: formatMoney(metrics.newProposalsAmount, "0 ₽"), icon: FileText, variant: "default" as const },
    { title: "Активные КП", value: metrics.activeProposals, icon: FileText, variant: "secondary" as const },
    { title: "Сумма активных КП", value: formatMoney(metrics.activeProposalsAmount, "0 ₽"), icon: FileText, variant: "default" as const },
    { title: "КП без follow-up", value: metrics.proposalNoFollowUp, icon: AlertTriangle, variant: "warning" as const },
    { title: "КП без файла", value: metrics.proposalNoFile, icon: AlertTriangle, variant: "warning" as const },
    { title: "Клиент думает 7+ дней", value: metrics.proposalThinking7, icon: AlertTriangle, variant: "warning" as const },
    { title: "Принятые КП за 7 дней", value: metrics.acceptedProposalsPeriod, icon: CheckSquare, variant: "secondary" as const },
    { title: "Отклоненные КП за 7 дней", value: metrics.declinedProposalsPeriod, icon: AlertTriangle, variant: "outline" as const },
    { title: "Мои КП", value: metrics.myProposals, icon: FileText, variant: "outline" as const },
    { title: "Мои КП без follow-up", value: metrics.myProposalNoFollowUp, icon: AlertTriangle, variant: "outline" as const },
    { title: "Мои КП думают", value: metrics.myProposalThinking, icon: AlertTriangle, variant: "outline" as const },
    { title: "Мой просроченный follow-up", value: metrics.myProposalOverdueFollowUp, icon: AlertTriangle, variant: "warning" as const },
    { title: "Мои принятые КП", value: metrics.myAcceptedProposals, icon: CheckSquare, variant: "outline" as const },
    { title: "Мои отклоненные КП", value: metrics.myDeclinedProposals, icon: AlertTriangle, variant: "outline" as const },
    { title: "Дизайнеры с потенциалом A", value: metrics.potentialADesigners, icon: BriefcaseBusiness, variant: "default" as const },
    { title: "Дизайнеры в статусе Спящий", value: metrics.sleepingDesigners, icon: FileText, variant: "secondary" as const },
    { title: "Мои клиенты", value: metrics.myClients, icon: UsersRound, variant: "outline" as const },
    { title: "Мои дизайнеры", value: metrics.myDesigners, icon: UsersRound, variant: "outline" as const },
    { title: "Мои шаги на сегодня", value: metrics.myDesignersToday, icon: CheckSquare, variant: "warning" as const },
    { title: "Мои дизайнеры без шага", value: metrics.myDesignersWithoutNextStep, icon: AlertTriangle, variant: "outline" as const },
    { title: "Мои клиенты без контакта", value: metrics.myClientsWithoutNextContact, icon: UsersRound, variant: "outline" as const }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Рабочий стол" description="Базовые контрольные показатели для руководителя и отдела продаж." />

      <DashboardMetricGrid cards={cards} />

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
