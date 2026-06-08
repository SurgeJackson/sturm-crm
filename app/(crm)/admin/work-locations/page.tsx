import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { DisplaySetupTokenButton } from "@/components/time-clock/display-setup-token-button";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Изменения сохранены." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <Card>
        <CardHeader><CardTitle>Создать рабочую точку</CardTitle></CardHeader>
        <CardContent>
          <form action={saveWorkLocationDirectAction} className="grid gap-2 md:grid-cols-4">
            <Input name="name" placeholder="Название" required />
            <Input name="code" placeholder="code-latin" required />
            <Input name="address" placeholder="Адрес" required className="md:col-span-2" />
            <Input name="latitude" placeholder="Широта" type="number" step="0.000001" required />
            <Input name="longitude" placeholder="Долгота" type="number" step="0.000001" required />
            <Input name="allowedRadiusMeters" placeholder="Радиус, м" type="number" defaultValue={100} required />
            <Input name="maxAllowedAccuracyMeters" placeholder="Погрешность, м" type="number" defaultValue={150} required />
            <Input name="timezone" placeholder="Часовой пояс" defaultValue="Europe/Moscow" />
            <label className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input name="isActive" type="checkbox" defaultChecked />
              Активна
            </label>
            <Button type="submit" className="md:col-span-2">
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Список точек</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Точка</TableHead>
                <TableHead>Геозона</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>QR-экраны</TableHead>
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
                  <TableCell label="QR-экраны">
                    <div className="space-y-2">
                      <DisplaySetupTokenButton locationId={location.id} />
                      {location.displayDevices.length ? location.displayDevices.map((device) => (
                        <div key={device.id} className="rounded-md border p-2 text-xs">
                          <div className="font-medium">{device.name}</div>
                          <div className="text-muted-foreground">{locationDisplayDeviceStatusLabels[device.status]} · {device.lastIpAddress ?? "IP не зафиксирован"}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Button asChild variant="outline" size="sm"><Link href={`/admin/location-display-devices/${device.id}`}>История</Link></Button>
                            {device.status === "ACTIVE" ? (
                              <>
                                <form action={revokeDisplayDeviceAction.bind(null, device.id)}>
                                  <Button variant="outline" size="sm">Отозвать</Button>
                                </form>
                                <form action={blockDisplayDeviceAction.bind(null, device.id)}>
                                  <Button variant="outline" size="sm">Блок</Button>
                                </form>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )) : <div className="text-xs text-muted-foreground">Нет подключенных экранов</div>}
                    </div>
                  </TableCell>
                  <TableCell label="Действия" actions>
                    <div className="space-y-2">
                      <form action={toggleWorkLocationAction.bind(null, location.id, !location.isActive)}>
                        <Button variant="outline" size="sm">{location.isActive ? "Выключить" : "Включить"}</Button>
                      </form>
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground">Редактировать</summary>
                        <form action={saveWorkLocationDirectAction} className="mt-2 grid gap-2">
                          <input type="hidden" name="id" value={location.id} />
                          <Input name="name" defaultValue={location.name} aria-label="Название" />
                          <Input name="code" defaultValue={location.code} aria-label="Код" />
                          <Input name="address" defaultValue={location.address} aria-label="Адрес" />
                          <Input name="latitude" type="number" step="0.000001" defaultValue={location.latitude} aria-label="Широта" />
                          <Input name="longitude" type="number" step="0.000001" defaultValue={location.longitude} aria-label="Долгота" />
                          <Input name="allowedRadiusMeters" type="number" defaultValue={location.allowedRadiusMeters} aria-label="Радиус" />
                          <Input name="maxAllowedAccuracyMeters" type="number" defaultValue={location.maxAllowedAccuracyMeters} aria-label="Погрешность" />
                          <Input name="timezone" defaultValue={location.timezone} aria-label="Часовой пояс" />
                          <label className="flex items-center gap-2 text-xs">
                            <input name="isActive" type="checkbox" defaultChecked={location.isActive} />
                            Активна
                          </label>
                          <Button size="sm">Сохранить</Button>
                        </form>
                      </details>
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
