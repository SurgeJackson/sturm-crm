import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit3, Plus, Power, PowerOff } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { saveShiftTemplateDirectAction, toggleShiftTemplateAction } from "@/modules/time-clock/actions";
import { getWorkLocationWithShiftTemplates } from "@/modules/time-clock/queries";
import { canManageShiftTemplates } from "@/permissions";

export default async function ShiftTemplatesPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageShiftTemplates(user)) redirect("/");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const location = await getWorkLocationWithShiftTemplates(id);
  if (!location) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Шаблоны смен: ${location.name}`}
        description="Преднастроенные смены точки используются в планировщике месячного графика."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Создать
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать шаблон смены</DialogTitle>
                </DialogHeader>
                <ShiftTemplateForm locationId={location.id} submitLabel="Создать" />
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline">
              <Link href="/admin/work-locations">
                <ArrowLeft className="h-4 w-4" />
                Рабочие точки
              </Link>
            </Button>
          </div>
        )}
      />
      <PageNoticeStack notices={[
        { show: Boolean(query.saved), message: "Изменения сохранены." },
        { show: Boolean(query.error), tone: "destructive", message: query.error === "validation" ? "Проверьте поля формы." : query.error ?? "Действие недоступно." }
      ]} />

      <Card>
        <CardHeader>
          <CardTitle>Смены точки</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Смена</TableHead>
                <TableHead>Время</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {location.shiftTemplates.length ? location.shiftTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell label="Смена">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: template.color ?? "transparent" }} aria-hidden="true" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell label="Время">
                    <div className="font-medium">{template.startsAt} - {template.endsAt}</div>
                    <div className="text-xs text-muted-foreground">Обед {template.breakMinutes} мин</div>
                  </TableCell>
                  <TableCell label="Порядок">{template.sortOrder}</TableCell>
                  <TableCell label="Статус">
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Активна" : "Отключена"}
                    </Badge>
                  </TableCell>
                  <TableCell label="Действия" actions>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <form action={toggleShiftTemplateAction.bind(null, template.id, location.id, !template.isActive)}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title={template.isActive ? "Отключить шаблон" : "Включить шаблон"}
                          aria-label={template.isActive ? "Отключить шаблон" : "Включить шаблон"}
                        >
                          {template.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </form>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="Редактировать" aria-label="Редактировать">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Редактировать шаблон смены</DialogTitle>
                          </DialogHeader>
                          <ShiftTemplateForm
                            id={template.id}
                            locationId={location.id}
                            name={template.name}
                            code={template.code}
                            startsAt={template.startsAt}
                            endsAt={template.endsAt}
                            breakMinutes={template.breakMinutes}
                            color={template.color ?? ""}
                            isActive={template.isActive}
                            sortOrder={template.sortOrder}
                            submitLabel="Сохранить"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={5}>Для этой точки еще нет шаблонов смен</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ShiftTemplateForm({
  id,
  locationId,
  name = "",
  code = "",
  startsAt = "10:00",
  endsAt = "19:00",
  breakMinutes = 60,
  color = "#2563eb",
  isActive = true,
  sortOrder = 0,
  submitLabel
}: {
  id?: string;
  locationId: string;
  name?: string;
  code?: string;
  startsAt?: string;
  endsAt?: string;
  breakMinutes?: number;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
  submitLabel: string;
}) {
  return (
    <form action={saveShiftTemplateDirectAction} className="grid gap-3 md:grid-cols-2">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input type="hidden" name="locationId" value={locationId} />
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Название смены</span>
        <Input name="name" placeholder="Дневная смена" defaultValue={name} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Код</span>
        <Input name="code" placeholder="day" defaultValue={code} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Начало</span>
        <Input name="startsAt" type="time" defaultValue={startsAt} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Окончание</span>
        <Input name="endsAt" type="time" defaultValue={endsAt} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Обед, минут</span>
        <Input name="breakMinutes" type="number" min={0} max={600} defaultValue={breakMinutes} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Цвет</span>
        <Input name="color" type="color" defaultValue={color || "#2563eb"} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Порядок</span>
        <Input name="sortOrder" type="number" min={0} defaultValue={sortOrder} />
      </label>
      <label className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
        <input name="isActive" type="checkbox" defaultChecked={isActive} />
        Активна
      </label>
      <div className="flex justify-end gap-2 md:col-span-2">
        {id ? (
          <DialogClose asChild>
            <Button type="button" variant="outline">Отмена</Button>
          </DialogClose>
        ) : null}
        <Button type="submit">
          <Plus className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
