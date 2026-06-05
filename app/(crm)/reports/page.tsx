import Link from "next/link";
import { BarChart3, BriefcaseBusiness, ClipboardCheck, FileText, Target, Timer, UserRound, UsersRound, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { href: "/reports/manager-dashboard", title: "Дашборд руководителя", description: "Продажи, дизайнеры, объекты, задачи и дисциплина.", icon: BarChart3 },
  { href: "/reports/activity", title: "Активность сотрудников", description: "Задачи, касания, звонки, встречи, КП и follow-up.", icon: UsersRound },
  { href: "/reports/crm-discipline", title: "CRM-дисциплина", description: "Качество заполнения CRM и Discipline Score.", icon: ClipboardCheck },
  { href: "/reports/deals", title: "Сделки", description: "Воронка, суммы, просрочки и причины проигрыша.", icon: BriefcaseBusiness },
  { href: "/reports/proposals", title: "КП", description: "Статусы, суммы, follow-up, файлы и причины отказа.", icon: FileText },
  { href: "/reports/designers", title: "Дизайнеры / архитекторы", description: "Этапы отношений, потенциал, касания и объекты.", icon: UserRound },
  { href: "/reports/objects", title: "Объекты", description: "Стадии, типы, участники и объекты без движения.", icon: Building2 },
  { href: "/reports/loss-reasons", title: "Причины проигрышей", description: "Почему теряются сделки, КП и объекты.", icon: Target },
  { href: "/reports/overdue", title: "Просрочки", description: "Просроченные задачи, follow-up, сделки и контакты.", icon: Timer },
  { href: "/reports/my", title: "Мои показатели", description: "Личная активность, просрочки и CRM Discipline Score.", icon: UsersRound }
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Отчеты</h1>
        <p className="mt-1 text-sm text-muted-foreground">Управленческие отчеты, KPI и CRM-дисциплина.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {report.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{report.description}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
