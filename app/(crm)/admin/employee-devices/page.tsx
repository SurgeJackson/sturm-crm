import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterActions, FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { approveEmployeeDeviceAction, blockEmployeeDeviceAction, revokeEmployeeDeviceAction } from "@/modules/time-clock/actions";
import { getEmployeeDevices, getEmployeeOptions, type EmployeeDeviceParams } from "@/modules/time-clock/queries";
import { employeeDeviceStatusLabels } from "@/lib/constants";
import { canManageEmployeeDevices } from "@/permissions";

export default async function EmployeeDevicesPage({ searchParams }: { searchParams: Promise<EmployeeDeviceParams & { saved?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageEmployeeDevices(user)) redirect("/");
  const params = await searchParams;
  const [devices, employees] = await Promise.all([getEmployeeDevices(params), getEmployeeOptions()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Устройства сотрудников" description="Подтверждение доверенных устройств и контроль передачи аккаунтов." />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Статус устройства обновлен." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <FilterBar resetHref="/admin/employee-devices">
        <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
        </FilterSelect>
        <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы">
          {Object.entries(employeeDeviceStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FilterSelect>
        <FilterSelect name="multi" defaultValue={params.multi} placeholder="Все устройства">
          <option value="1">Используется несколькими</option>
        </FilterSelect>
        <FilterActions><Button type="submit" variant="secondary">Показать</Button></FilterActions>
      </FilterBar>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Устройство</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Лимит</TableHead>
                <TableHead>Используется несколькими</TableHead>
                <TableHead>Последнее использование</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.items.length ? devices.items.map((device) => (
                <TableRow key={device.id}>
                  <TableCell label="Сотрудник">{device.employee.user.name}</TableCell>
                  <TableCell label="Устройство">
                    <div className="font-medium">{device.deviceName ?? device.deviceId}</div>
                    <div className="text-xs text-muted-foreground">{device.userAgent}</div>
                  </TableCell>
                  <TableCell label="Статус"><Badge variant={device.status === "TRUSTED" ? "default" : "warning"}>{employeeDeviceStatusLabels[device.status]}</Badge></TableCell>
                  <TableCell label="Лимит">{device.trustedDevicesCount} / {device.employee.trustedDeviceLimit}</TableCell>
                  <TableCell label="Используется несколькими">{device.usedByMultipleEmployees ? "Да" : "Нет"}</TableCell>
                  <TableCell label="Последнее использование">{device.lastSeenAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Действия" actions>
                    <div className="flex flex-wrap gap-1">
                      {device.status !== "TRUSTED" ? <form action={approveEmployeeDeviceAction.bind(null, device.id)}><Button size="sm">Подтвердить</Button></form> : null}
                      {device.status !== "BLOCKED" ? <form action={blockEmployeeDeviceAction.bind(null, device.id)}><Button size="sm" variant="destructive">Блок</Button></form> : null}
                      {device.status === "TRUSTED" ? <form action={revokeEmployeeDeviceAction.bind(null, device.id)}><Button size="sm" variant="outline">Отозвать</Button></form> : null}
                    </div>
                  </TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={7}>Устройства не найдены</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination total={devices.total} page={devices.page} pageCount={devices.pageCount} previousHref={devices.page > 1 ? `/admin/employee-devices?page=${devices.page - 1}` : undefined} nextHref={devices.page < devices.pageCount ? `/admin/employee-devices?page=${devices.page + 1}` : undefined} />
    </div>
  );
}
