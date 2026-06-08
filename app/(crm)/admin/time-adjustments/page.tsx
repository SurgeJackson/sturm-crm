import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterActions, FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { approveAdjustmentAction, rejectAdjustmentAction } from "@/modules/time-clock/actions";
import { getAdjustmentRequests, getEmployeeOptions, type AdjustmentParams } from "@/modules/time-clock/queries";
import { timeAdjustmentActionLabels, timeAdjustmentStatusLabels, timeEventTypeLabels } from "@/lib/constants";
import { canManageTimeAdjustments } from "@/permissions";

export default async function TimeAdjustmentsPage({ searchParams }: { searchParams: Promise<AdjustmentParams & { saved?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageTimeAdjustments(user)) redirect("/");
  const params = await searchParams;
  const [requests, employees] = await Promise.all([getAdjustmentRequests(params), getEmployeeOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Корректировки времени" description="Заявки сотрудников на ручное добавление отметок." />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Заявка обработана." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <FilterBar resetHref="/admin/time-adjustments">
        <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
        </FilterSelect>
        <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы">
          {Object.entries(timeAdjustmentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FilterSelect>
        <FilterActions><Button type="submit" variant="secondary">Показать</Button></FilterActions>
      </FilterBar>
      <div className="space-y-3">
        {requests.items.length ? requests.items.map((request) => (
          <Card key={request.id}>
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{request.employee.user.name} · {request.date}</div>
                  <Badge variant={request.status === "PENDING" ? "warning" : "outline"}>{timeAdjustmentStatusLabels[request.status]}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeAdjustmentActionLabels[request.requestedAction]} · {request.eventType ? timeEventTypeLabels[request.eventType] : "Тип не указан"} · {request.requestedOccurredAt?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) ?? "Время не указано"}
                </div>
                <div className="rounded-md border p-3 text-sm">{request.comment}</div>
                {request.reviewComment ? <div className="text-sm text-muted-foreground">Решение: {request.reviewComment}</div> : null}
              </div>
              {request.status === "PENDING" ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <form action={approveAdjustmentAction.bind(null, request.id)} className="space-y-2 rounded-md border p-3">
                    <Textarea name="comment" placeholder="Комментарий к подтверждению" />
                    <Button className="w-full">Подтвердить</Button>
                  </form>
                  <form action={rejectAdjustmentAction.bind(null, request.id)} className="space-y-2 rounded-md border p-3">
                    <Textarea name="comment" placeholder="Причина отклонения" required />
                    <Button variant="destructive" className="w-full">Отклонить</Button>
                  </form>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )) : <Card><CardContent className="p-6 text-center text-muted-foreground">Заявок нет</CardContent></Card>}
      </div>
      <Pagination total={requests.total} page={requests.page} pageCount={requests.pageCount} previousHref={requests.page > 1 ? `/admin/time-adjustments?page=${requests.page - 1}` : undefined} nextHref={requests.page < requests.pageCount ? `/admin/time-adjustments?page=${requests.page + 1}` : undefined} />
    </div>
  );
}
