import { redirect } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { SchedulePlannerMatrix } from "@/components/schedule-planner/schedule-planner-matrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createSchedulePlanAction } from "@/modules/schedule-planner/actions";
import { schedulePlannerPeriodSchema } from "@/modules/schedule-planner/schemas";
import { getSchedulePlannerData } from "@/modules/schedule-planner/service";
import { getWorkLocationOptions } from "@/modules/time-clock/queries";
import { canApproveSchedulePlanner, canEditSchedulePlanner, canViewSchedulePlanner } from "@/permissions";

type SchedulePlannerParams = {
  locationId?: string;
  year?: string;
  month?: string;
  saved?: string;
  error?: string;
};

const monthLabels = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

export default async function SchedulePlannerPage({ searchParams }: { searchParams: Promise<SchedulePlannerParams> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canViewSchedulePlanner(user)) redirect("/");

  const params = await searchParams;
  const locations = await getWorkLocationOptions(true);
  const now = new Date();
  const selectedLocationId = params.locationId || locations[0]?.id || "";
  const selectedYear = Number(params.year || now.getFullYear());
  const selectedMonth = Number(params.month || now.getMonth() + 1);
  const parsed = selectedLocationId ? schedulePlannerPeriodSchema.safeParse({
    locationId: selectedLocationId,
    year: selectedYear,
    month: selectedMonth
  }) : null;
  const plannerData = parsed?.success ? await getSchedulePlannerData(parsed.data) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Плановый график"
        description="Месячная матрица планирования смен сотрудников по рабочей точке."
      />
      <PageNoticeStack notices={[
        { show: params.saved === "created", message: "График создан." },
        { show: params.saved === "loaded", message: "График уже был создан и загружен." },
        { show: Boolean(params.error), tone: "destructive", message: params.error === "validation" ? "Проверьте параметры графика." : params.error ?? "Действие недоступно." }
      ]} />

      <Card>
        <CardHeader><CardTitle>Период планирования</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-[minmax(220px,1.5fr)_minmax(140px,0.7fr)_minmax(120px,0.6fr)_auto]" action="/admin/schedule-planner">
            <NativeSelect name="locationId" defaultValue={selectedLocationId} aria-label="Рабочая точка" required>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </NativeSelect>
            <NativeSelect name="month" defaultValue={String(selectedMonth)} aria-label="Месяц" required>
              {monthLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
            </NativeSelect>
            <Input name="year" type="number" min={2020} max={2100} defaultValue={selectedYear} aria-label="Год" required />
            <Button type="submit" variant="outline">Загрузить</Button>
          </form>
        </CardContent>
      </Card>

      {!locations.length ? (
        <Card>
          <CardContent className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
            Сначала создайте активную рабочую точку.
          </CardContent>
        </Card>
      ) : null}

      {locations.length && plannerData && !plannerData.schedulePlan ? (
        <Card>
          <CardHeader><CardTitle>График не создан</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Для выбранной точки и месяца еще нет черновика графика. При создании будут добавлены пустые ячейки для всех активных сотрудников точки.
            </p>
            <form action={createSchedulePlanAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="locationId" value={selectedLocationId} />
              <input type="hidden" name="year" value={selectedYear} />
              <input type="hidden" name="month" value={selectedMonth} />
              <Button type="submit" disabled={!canEditSchedulePlanner(user)}>
                <Plus className="h-4 w-4" />
                Создать график
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {plannerData?.schedulePlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {plannerData.location.name} · {monthLabels[plannerData.month - 1]} {plannerData.year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SchedulePlannerMatrix
              initialData={plannerData}
              canEdit={canEditSchedulePlanner(user)}
              canApprove={canApproveSchedulePlanner(user)}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
