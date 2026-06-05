import { AlertTriangle, BriefcaseBusiness, Building2, CheckSquare, FileText, UserRound, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  commercialProposalStatusLabels,
  dealLossReasonLabels,
  dealStageLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  proposalDeclineReasonLabels
} from "@/lib/constants";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const metrics = await getDashboardMetrics(user);
  const cards = [
    { title: "Новые клиенты за 7 дней", value: metrics.newClients, icon: UsersRound, variant: "default" as const },
    { title: "Новые дизайнеры за 7 дней", value: metrics.newDesigners, icon: UsersRound, variant: "secondary" as const },
    { title: "Просроченные задачи", value: metrics.overdueTasks, icon: AlertTriangle, variant: "warning" as const },
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
    { title: "Сумма активных сделок", value: `${metrics.activeDealsAmount.toLocaleString("ru-RU")} ₽`, icon: BriefcaseBusiness, variant: "default" as const },
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
    { title: "Сумма новых КП", value: `${metrics.newProposalsAmount.toLocaleString("ru-RU")} ₽`, icon: FileText, variant: "default" as const },
    { title: "Активные КП", value: metrics.activeProposals, icon: FileText, variant: "secondary" as const },
    { title: "Сумма активных КП", value: `${metrics.activeProposalsAmount.toLocaleString("ru-RU")} ₽`, icon: FileText, variant: "default" as const },
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
      <div>
        <h1 className="text-2xl font-semibold">Рабочий стол</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Базовые контрольные показатели для руководителя и отдела продаж.
        </p>
      </div>

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

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Сделки по стадиям</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.dealsByStage).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет сделок.</p>
            ) : (
              Object.entries(metrics.dealsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{dealStageLabels[stage as keyof typeof dealStageLabels]}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Причины проигрышей</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.dealLossReasons).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет проигранных сделок.</p>
            ) : (
              Object.entries(metrics.dealLossReasons).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{dealLossReasonLabels[reason as keyof typeof dealLossReasonLabels]}</span>
                  <Badge variant="warning">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сделки по ответственным</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.dealResponsibleCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет сделок.</p>
            ) : (
              metrics.dealResponsibleCounts.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{item.name}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активные дизайнеры по этапам</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(metrics.activeDesignersByStage).length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет активных дизайнеров.</p>
          ) : (
            Object.entries(metrics.activeDesignersByStage).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{designerRelationshipStageLabels[stage as keyof typeof designerRelationshipStageLabels]}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>КП по статусам</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.proposalStatusCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет КП.</p>
            ) : (
              Object.entries(metrics.proposalStatusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{commercialProposalStatusLabels[status as keyof typeof commercialProposalStatusLabels]}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Причины отклонения КП</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.proposalDeclineReasonCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет отклоненных КП.</p>
            ) : (
              Object.entries(metrics.proposalDeclineReasonCounts).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{proposalDeclineReasonLabels[reason as keyof typeof proposalDeclineReasonLabels]}</span>
                  <Badge variant="warning">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Сумма КП по ответственным</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.proposalResponsibleAmounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет КП.</p>
            ) : (
              metrics.proposalResponsibleAmounts.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{item.name}</span>
                  <Badge variant="secondary">{item.amount.toLocaleString("ru-RU")} ₽</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Объекты по стадиям</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {Object.entries(metrics.objectsByStage).length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет объектов.</p>
            ) : (
              Object.entries(metrics.objectsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{objectStageLabels[stage as keyof typeof objectStageLabels]}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ дизайнеров по объектам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.topDesignersByObjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет переданных объектов.</p>
            ) : (
              metrics.topDesignersByObjects.map((designer) => (
                <div key={designer.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</span>
                  <Badge variant="secondary">{designer.transferredObjectsCount}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
