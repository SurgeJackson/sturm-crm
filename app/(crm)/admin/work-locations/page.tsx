import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit3, History, MapPin, Plus, Power, PowerOff, Settings2, ShieldOff, Unlink } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { DisplaySetupTokenButton } from "@/components/time-clock/display-setup-token-button";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { blockDisplayDeviceAction, saveWorkLocationDirectAction, revokeDisplayDeviceAction, toggleWorkLocationAction } from "@/modules/time-clock/actions";
import { getWorkLocations, type WorkLocationParams } from "@/modules/time-clock/queries";
import { locationDisplayDeviceStatusLabels } from "@/lib/constants";
import { canManageWorkLocations } from "@/permissions";

export default async function WorkLocationsPage({ searchParams }: { searchParams: Promise<WorkLocationParams & { saved?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageWorkLocations(user)) redirect("/");
  const params = await searchParams;
  const locations = await getWorkLocations(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Рабочие точки"
        description="Геозоны, QR-экраны и параметры допустимой точности для учета рабочего времени."
        actions={(
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Создать
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать рабочую точку</DialogTitle>
              </DialogHeader>
              <WorkLocationForm submitLabel="Создать" />
            </DialogContent>
          </Dialog>
        )}
      />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Изменения сохранены." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <Card>
        <CardHeader><CardTitle>Список точек</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Точка</TableHead>
                <TableHead>Геозона</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>QR-экран</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.items.length ? locations.items.map((location) => (
                <TableRow key={location.id}>
                  <TableCell label="Точка">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs text-muted-foreground">{location.code} · {location.address}</div>
                  </TableCell>
                  <TableCell label="Геозона">
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {location.latitude}, {location.longitude}</div>
                    <div className="text-xs text-muted-foreground">Радиус {location.allowedRadiusMeters} м, точность {location.maxAllowedAccuracyMeters} м</div>
                  </TableCell>
                  <TableCell label="Статус"><Badge variant={location.isActive ? "default" : "secondary"}>{location.isActive ? "Активна" : "Выключена"}</Badge></TableCell>
                  <TableCell label="QR-экран">
                    <div
                      className="max-w-48 truncate text-xs text-muted-foreground"
                      title={getDisplayDevicesFullText(location.displayDevices)}
                    >
                      {getDisplayDevicesShortText(location.displayDevices)}
                    </div>
                  </TableCell>
                  <TableCell label="Действия" actions>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" title="Редактировать" aria-label="Редактировать">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Редактировать рабочую точку</DialogTitle>
                            </DialogHeader>
                            <WorkLocationForm
                              id={location.id}
                              name={location.name}
                              code={location.code}
                              address={location.address}
                              latitude={location.latitude}
                              longitude={location.longitude}
                              allowedRadiusMeters={location.allowedRadiusMeters}
                              maxAllowedAccuracyMeters={location.maxAllowedAccuracyMeters}
                              timezone={location.timezone}
                              isActive={location.isActive}
                              submitLabel="Сохранить"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button asChild variant="outline" size="icon" className="h-8 w-8" title="Шаблоны смен" aria-label="Шаблоны смен">
                          <Link href={`/admin/work-locations/${location.id}/shift-templates`}>
                            <Settings2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={toggleWorkLocationAction.bind(null, location.id, !location.isActive)}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            title={location.isActive ? "Выключить точку" : "Включить точку"}
                            aria-label={location.isActive ? "Выключить точку" : "Включить точку"}
                          >
                            {location.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </form>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <DisplaySetupTokenButton locationId={location.id} compact />
                        {location.displayDevices.map((device) => (
                          <div key={device.id} className="flex items-center gap-1">
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              title={`История QR-экрана: ${device.name}`}
                              aria-label={`История QR-экрана: ${device.name}`}
                            >
                              <Link href={`/admin/location-display-devices/${device.id}`}>
                                <History className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            {device.status === "ACTIVE" ? (
                              <>
                                <form action={revokeDisplayDeviceAction.bind(null, device.id)}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    title={`Отозвать QR-экран: ${device.name}`}
                                    aria-label={`Отозвать QR-экран: ${device.name}`}
                                  >
                                    <Unlink className="h-3.5 w-3.5" />
                                  </Button>
                                </form>
                                <form action={blockDisplayDeviceAction.bind(null, device.id)}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    title={`Заблокировать QR-экран: ${device.name}`}
                                    aria-label={`Заблокировать QR-экран: ${device.name}`}
                                  >
                                    <ShieldOff className="h-3.5 w-3.5" />
                                  </Button>
                                </form>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={5}>Рабочие точки еще не созданы</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination total={locations.total} page={locations.page} pageCount={locations.pageCount} previousHref={locations.page > 1 ? `/admin/work-locations?page=${locations.page - 1}` : undefined} nextHref={locations.page < locations.pageCount ? `/admin/work-locations?page=${locations.page + 1}` : undefined} />
    </div>
  );
}

function WorkLocationForm({
  id,
  name = "",
  code = "",
  address = "",
  latitude,
  longitude,
  allowedRadiusMeters = 100,
  maxAllowedAccuracyMeters = 150,
  timezone = "Europe/Moscow",
  isActive = true,
  submitLabel
}: {
  id?: string;
  name?: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  allowedRadiusMeters?: number;
  maxAllowedAccuracyMeters?: number;
  timezone?: string;
  isActive?: boolean;
  submitLabel: string;
}) {
  return (
    <form action={saveWorkLocationDirectAction} className="grid gap-3 md:grid-cols-2">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Название</span>
        <Input name="name" placeholder="Основной офис" defaultValue={name} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Код</span>
        <Input name="code" placeholder="main-office" defaultValue={code} required />
      </label>
      <label className="grid gap-1.5 md:col-span-2">
        <span className="text-sm font-medium leading-none">Адрес</span>
        <Input name="address" placeholder="Город, улица, дом" defaultValue={address} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Широта</span>
        <Input name="latitude" placeholder="55.755864" type="number" step="0.000001" defaultValue={latitude} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Долгота</span>
        <Input name="longitude" placeholder="37.617698" type="number" step="0.000001" defaultValue={longitude} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Радиус геозоны, м</span>
        <Input name="allowedRadiusMeters" placeholder="100" type="number" defaultValue={allowedRadiusMeters} required />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium leading-none">Максимальная погрешность, м</span>
        <Input name="maxAllowedAccuracyMeters" placeholder="150" type="number" defaultValue={maxAllowedAccuracyMeters} required />
      </label>
      <label className="grid gap-1.5 md:col-span-2">
        <span className="text-sm font-medium leading-none">Часовой пояс</span>
        <Input name="timezone" placeholder="Europe/Moscow" defaultValue={timezone} />
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

function getDisplayDevicesShortText(devices: Array<{ name: string; status: keyof typeof locationDisplayDeviceStatusLabels }>) {
  if (!devices.length) return "Не подключен";

  const visible = devices
    .slice(0, 2)
    .map((device) => `${device.name} (${locationDisplayDeviceStatusLabels[device.status]})`)
    .join(", ");
  const hiddenCount = devices.length - 2;

  return hiddenCount > 0 ? `${visible} +${hiddenCount}` : visible;
}

function getDisplayDevicesFullText(devices: Array<{ name: string; status: keyof typeof locationDisplayDeviceStatusLabels }>) {
  if (!devices.length) return "QR-экраны не подключены";

  return devices
    .map((device) => `${device.name}: ${locationDisplayDeviceStatusLabels[device.status]}`)
    .join(", ");
}
