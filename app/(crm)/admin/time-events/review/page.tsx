import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { approveTimeEventAction, rejectTimeEventAction } from "@/modules/time-clock/actions";
import { getPendingTimeEvents } from "@/modules/time-clock/queries";
import { timeEventTypeLabels, timeRiskFlagLabels } from "@/lib/constants";
import { canReviewTimeEvents } from "@/permissions";

export default async function TimeEventsReviewPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canReviewTimeEvents(user)) redirect("/");
  const params = await searchParams;
  const events = await getPendingTimeEvents();

  return (
    <div className="space-y-6">
      <PageHeader title="Спорные отметки" description="Проверка отметок, которые не прошли автоматические правила." />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Решение сохранено, табель пересчитан." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <div className="space-y-3">
        {events.length ? events.map((event) => (
          <Card key={event.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{event.employee.user.name} · {timeEventTypeLabels[event.type]} · {event.occurredAt.toLocaleString("ru-RU")}</div>
                  <div className="text-sm text-muted-foreground">{event.location.name} · {event.ipAddress ?? "IP не зафиксирован"}</div>
                </div>
                <Badge variant="warning">На проверке</Badge>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <Info label="Расстояние" value={event.distanceFromLocationMeters != null ? `${Math.round(event.distanceFromLocationMeters)} м` : "Нет"} />
                <Info label="Точность" value={event.accuracy != null ? `${Math.round(event.accuracy)} м` : "Нет"} />
                <Info label="Устройство" value={event.trustedDevice?.deviceName ?? event.deviceId ?? "Нет"} />
                <Info label="UserAgent" value={event.userAgent ?? "Нет"} />
              </div>
              {event.riskFlags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {event.riskFlags.map((flag) => <Badge key={flag} variant="outline">{timeRiskFlagLabels[flag] ?? flag}</Badge>)}
                </div>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-3">
                <form action={approveTimeEventAction.bind(null, event.id)} className="space-y-2 rounded-md border p-3">
                  <Textarea name="comment" placeholder="Комментарий к подтверждению" />
                  <Button type="submit" className="w-full">Подтвердить</Button>
                </form>
                <form action={approveTimeEventAction.bind(null, event.id)} className="space-y-2 rounded-md border p-3">
                  <Input name="overrideOccurredAt" type="datetime-local" required />
                  <Textarea name="comment" placeholder="Комментарий обязателен при изменении" required />
                  <Button type="submit" variant="secondary" className="w-full">Изменить и подтвердить</Button>
                </form>
                <form action={rejectTimeEventAction.bind(null, event.id)} className="space-y-2 rounded-md border p-3">
                  <Textarea name="comment" placeholder="Причина отклонения" required />
                  <Button type="submit" variant="destructive" className="w-full">Отклонить</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )) : <Card><CardContent className="p-6 text-center text-muted-foreground">Спорных отметок нет</CardContent></Card>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm">{value}</div>
    </div>
  );
}
