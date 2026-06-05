import { AlertTriangle, BriefcaseBusiness, Building2, CheckSquare, FileText, UsersRound } from "lucide-react";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const cards = [
    { title: "Новые клиенты", value: metrics.newClients, icon: UsersRound, variant: "default" as const },
    { title: "Новые дизайнеры", value: metrics.newDesigners, icon: UsersRound, variant: "secondary" as const },
    { title: "Просроченные задачи", value: metrics.overdueTasks, icon: AlertTriangle, variant: "warning" as const },
    { title: "Сделки без следующего шага", value: metrics.dealsWithoutNextStep, icon: BriefcaseBusiness, variant: "outline" as const },
    { title: "КП без follow-up", value: metrics.proposalsWithoutFollowUp, icon: FileText, variant: "outline" as const },
    { title: "Дизайнеры без касаний", value: metrics.designersWithoutTouch, icon: UsersRound, variant: "outline" as const },
    { title: "Активные объекты", value: metrics.activeObjects, icon: Building2, variant: "secondary" as const },
    { title: "Активные КП", value: metrics.activeProposals, icon: CheckSquare, variant: "default" as const }
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
                  Stage 1
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
