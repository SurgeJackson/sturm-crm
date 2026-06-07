import { activateUserAction, changeUserRoleAction, deactivateUserAction, sendUserPasswordResetAction } from "@/modules/users/admin-actions";
import { AuditLogCard, EntityDetailTabs } from "@/components/crm/detail-page";
import { detailDate, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { CompactMetricCard } from "@/components/crm/summary-card";
import { BadgeCell, EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/ui/native-select";
import { roleLabels } from "@/lib/constants";
import type { getAdminUser } from "@/modules/users/admin-queries";
import { getPermissionMatrix, userStatus, userStatusLabels } from "@/modules/users/admin-queries";
import { roleOptions } from "@/modules/crm/options";
import { formatRussianDate } from "@/utils/date";

type UserDetail = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;
type PermissionMatrix = Awaited<ReturnType<typeof getPermissionMatrix>>;

export function UserDetailTabs({ detail, permissions }: { detail: UserDetail; permissions: PermissionMatrix }) {
  const { user } = detail;
  const status = userStatus(user);

  return (
    <EntityDetailTabs
      tabs={[
        {
          value: "main",
          label: "Основное",
          content: (
            <div className="space-y-4">
              <EntityDetailsCard
                title="Пользователь"
                fields={[
                  detailText("Имя", user.name),
                  detailText("Email", user.email),
                  detailText("Роль", roleLabels[user.role]),
                  detailText("Статус", userStatusLabels[status]),
                  detailDate("Email подтвержден", user.emailVerifiedAt),
                  detailDate("Последний вход", user.lastLoginAt),
                  detailDate("Создан", user.createdAt),
                  detailDate("Деактивирован", user.deactivatedAt),
                  detailText("Деактивировал", user.deactivatedBy?.name)
                ]}
              />
              <TableCard title="Управление">
                <TableBody>
                  <TableRow>
                    <TableCell label="Роль">
                      <form action={changeUserRoleAction.bind(null, user.id)} className="flex flex-wrap items-center gap-2">
                        <NativeSelect name="role" defaultValue={user.role} className="max-w-xs">
                          {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </NativeSelect>
                        <Button type="submit" size="sm" variant="secondary">Сменить роль</Button>
                      </form>
                    </TableCell>
                    <TableCell actions>
                      <div className="flex flex-wrap gap-2">
                        {user.isActive && !user.deactivatedAt ? (
                          <form action={deactivateUserAction.bind(null, user.id)}><Button type="submit" size="sm" variant="outline">Деактивировать</Button></form>
                        ) : (
                          <form action={activateUserAction.bind(null, user.id)}><Button type="submit" size="sm" variant="secondary">Активировать</Button></form>
                        )}
                        <form action={sendUserPasswordResetAction.bind(null, user.id, user.email)}><Button type="submit" size="sm" variant="outline">Сбросить пароль</Button></form>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </TableCard>
            </div>
          )
        },
        {
          value: "permissions",
          label: "Права доступа",
          content: <UserPermissionsTable permissions={permissions} role={user.role} />
        },
        {
          value: "activity",
          label: "Активность",
          content: (
            <div className="grid gap-4 md:grid-cols-3">
              <CompactMetricCard title="Клиенты" value={detail.activity.clients} />
              <CompactMetricCard title="Дизайнеры" value={detail.activity.designers} />
              <CompactMetricCard title="Объекты" value={detail.activity.objects} />
              <CompactMetricCard title="Сделки" value={detail.activity.deals} />
              <CompactMetricCard title="КП" value={detail.activity.proposals} />
              <CompactMetricCard title="Задачи / касания" value={detail.activity.tasks} />
            </div>
          )
        },
        {
          value: "security",
          label: "Безопасность",
          content: <SecurityLogTable logs={detail.securityLogs} />
        },
        {
          value: "audit",
          label: "История изменений",
          content: <AuditLogCard logs={detail.auditLogs} formatDate={formatRussianDate} />
        }
      ]}
    />
  );
}

function UserPermissionsTable({ permissions, role }: { permissions: PermissionMatrix; role: keyof typeof roleLabels }) {
  const rows = permissions.map((item) => ({
    ...item,
    access: item.roles.find((entry) => entry.role === role)
  }));
  return (
    <TableCard title="Права роли">
      <TableHeader><TableRow><TableHead>Право</TableHead><TableHead>Доступ</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell label="Право">{row.label}</TableCell>
            <BadgeCell cellLabel="Доступ" variant={row.access?.isAllowed ? "secondary" : "outline"}>{row.access?.isAllowed ? "Разрешено" : "Запрещено"}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

function SecurityLogTable({ logs }: { logs: UserDetail["securityLogs"] }) {
  return (
    <TableCard title="События безопасности">
      <TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Действие</TableHead><TableHead>IP</TableHead><TableHead>Уровень</TableHead></TableRow></TableHeader>
      <TableBody>
        {logs.length === 0 ? <EmptyTableRow colSpan={4}>Событий нет</EmptyTableRow> : logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell label="Дата">{formatRussianDate(log.createdAt)}</TableCell>
            <TableCell label="Действие">{log.action}</TableCell>
            <TableCell label="IP">{log.ipAddress ?? "Нет"}</TableCell>
            <BadgeCell cellLabel="Уровень" variant={log.severity === "CRITICAL" || log.severity === "WARNING" ? "warning" : "outline"}>{log.severity}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
