import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDisplayDeviceDetail } from "@/modules/time-clock/queries";
import { locationDisplayDeviceStatusLabels, locationDisplaySessionStatusLabels, qrTokenStatusLabels } from "@/lib/constants";
import { canManageWorkLocations } from "@/permissions";

export default async function LocationDisplayDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageWorkLocations(user)) redirect("/");
  const { id } = await params;
  const detail = await getDisplayDeviceDetail(id);
  if (!detail) redirect("/admin/work-locations?error=display-not-found");
  const { device, auditLogs } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`QR-экран: ${device.name}`}
        description={`${device.location.name} · ${device.location.address}`}
        actions={<Button asChild variant="outline"><Link href="/admin/work-locations">К рабочим точкам</Link></Button>}
      />
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Статус" value={locationDisplayDeviceStatusLabels[device.status]} />
        <Info label="Device ID" value={device.deviceId} />
        <Info label="Последний IP" value={device.lastIpAddress ?? "Не зафиксирован"} />
        <Info label="Последняя активность" value={device.lastSeenAt?.toLocaleString("ru-RU") ?? "Нет"} />
      </div>

      <Card>
        <CardHeader><CardTitle>Display-сессии</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Создана</TableHead>
                <TableHead>Истекает</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Последний IP</TableHead>
                <TableHead>Последняя активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {device.displaySessions.length ? device.displaySessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell label="Создана">{session.createdAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Истекает">{session.expiresAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Статус"><Badge variant={session.status === "ACTIVE" ? "default" : "warning"}>{locationDisplaySessionStatusLabels[session.status]}</Badge></TableCell>
                  <TableCell label="Последний IP">{session.lastIpAddress ?? "Нет"}</TableCell>
                  <TableCell label="Последняя активность">{session.lastSeenAt?.toLocaleString("ru-RU") ?? "Нет"}</TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={5}>Сессий нет</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Последние QR-токены</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Создан</TableHead>
                <TableHead>Истекает</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Использован</TableHead>
                <TableHead>Сотрудник</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {device.qrTokens.length ? device.qrTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell label="Создан">{token.createdAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Истекает">{token.expiresAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Статус"><Badge variant={token.status === "ACTIVE" ? "default" : "outline"}>{qrTokenStatusLabels[token.status]}</Badge></TableCell>
                  <TableCell label="Использован">{token.usedAt?.toLocaleString("ru-RU") ?? "Нет"}</TableCell>
                  <TableCell label="Сотрудник">{token.usedByEmployee?.user.name ?? "Нет"}</TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={5}>QR-токенов нет</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit log QR-экрана</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Данные</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length ? auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell label="Дата">{log.createdAt.toLocaleString("ru-RU")}</TableCell>
                  <TableCell label="Действие">{log.action}</TableCell>
                  <TableCell label="Пользователь">{log.user.name}</TableCell>
                  <TableCell label="Данные"><pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(log.after ?? log.before ?? {}, null, 2)}</pre></TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={4}>Audit log пуст</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 break-words font-medium">{value}</div>
      </CardContent>
    </Card>
  );
}
