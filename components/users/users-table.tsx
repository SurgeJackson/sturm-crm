import { BadgeCell, DateCell, EmptyTableRow, EntityLinkCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/lib/constants";
import type { getAdminUsers } from "@/modules/users/admin-queries";
import { userStatus, userStatusLabels } from "@/modules/users/admin-queries";
import { formatRussianDate } from "@/utils/date";

type UserRow = Awaited<ReturnType<typeof getAdminUsers>>["items"][number];

function statusVariant(status: ReturnType<typeof userStatus>) {
  if (status === "ACTIVE") return "secondary";
  if (status === "LOCKED" || status === "DEACTIVATED") return "warning";
  return "outline";
}

export function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Email подтвержден</TableHead>
          <TableHead>Последний вход</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <EmptyTableRow colSpan={6}>Пользователи не найдены</EmptyTableRow>
        ) : users.map((user) => {
          const status = userStatus(user);
          return (
            <TableRow key={user.id}>
              <EntityLinkCell href={`/settings/users/${user.id}`} title={user.name} description={user.email} cellLabel="Имя" />
              <TableCell label="Email">{user.email}</TableCell>
              <BadgeCell cellLabel="Роль" variant="outline">{roleLabels[user.role]}</BadgeCell>
              <BadgeCell cellLabel="Статус" variant={statusVariant(status)}>{userStatusLabels[status]}</BadgeCell>
              <DateCell cellLabel="Email подтвержден">{formatRussianDate(user.emailVerifiedAt)}</DateCell>
              <DateCell cellLabel="Последний вход">{formatRussianDate(user.lastLoginAt)}</DateCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableCard>
  );
}
