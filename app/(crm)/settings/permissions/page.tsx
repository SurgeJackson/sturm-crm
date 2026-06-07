import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/lib/constants";
import { getPermissionMatrix } from "@/modules/users/admin-queries";
import { canAccessSettings } from "@/permissions";

export default async function PermissionsPage() {
  const user = await getCurrentUser();
  if (!canAccessSettings(user)) redirect("/");
  const matrix = await getPermissionMatrix();

  return (
    <div className="space-y-6">
      <PageHeader title="Права доступа" description="Read-only матрица дефолтных прав и DB overrides по ролям." />
      <TableCard>
        <TableHeader>
          <TableRow>
            <TableHead>Право</TableHead>
            {Object.entries(roleLabels).map(([role, label]) => <TableHead key={role}>{label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((row) => (
            <TableRow key={row.key}>
              <TableCell label="Право">{row.label}</TableCell>
              {row.roles.map((entry) => (
                <BadgeCell key={entry.role} cellLabel={roleLabels[entry.role]} variant={entry.isAllowed ? "secondary" : "outline"}>
                  {entry.isAllowed ? "Да" : "Нет"}{entry.isOverridden ? " *" : ""}
                </BadgeCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </div>
  );
}
