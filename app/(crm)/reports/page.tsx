import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Отчеты</h1>
        <p className="mt-1 text-sm text-muted-foreground">Контроль активности, задач и проектных продаж.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Активность сотрудников
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Задачи, касания, звонки, встречи, отправки КП и follow-up за выбранный период.</p>
            <Button asChild>
              <Link href="/reports/activity">Открыть отчет</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
