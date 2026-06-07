import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect, filterShortcutHref, type ActiveFilter } from "@/components/ui/filter-bar";
import { securityActionLabels, securitySeverityLabels, type SecurityLogSearchParams } from "@/modules/security/queries";

type UserOption = { id: string; name: string; email: string };

export function SecurityFilters({ params, users, actions }: { params: SecurityLogSearchParams; users: UserOption[]; actions: string[] }) {
  const activeFilters: ActiveFilter[] = [
    params.from ? { key: "from", label: "С", value: params.from, href: filterShortcutHref("/security", params, { from: undefined, page: undefined }) } : null,
    params.to ? { key: "to", label: "По", value: params.to, href: filterShortcutHref("/security", params, { to: undefined, page: undefined }) } : null,
    params.userId ? { key: "userId", label: "Пользователь", value: users.find((user) => user.id === params.userId)?.name ?? params.userId, href: filterShortcutHref("/security", params, { userId: undefined, page: undefined }) } : null,
    params.action ? { key: "action", label: "Событие", value: securityActionLabels[params.action] ?? params.action, href: filterShortcutHref("/security", params, { action: undefined, page: undefined }) } : null,
    params.severity ? { key: "severity", label: "Уровень", value: securitySeverityLabels[params.severity as keyof typeof securitySeverityLabels] ?? params.severity, href: filterShortcutHref("/security", params, { severity: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-5" activeFilters={activeFilters} resetHref="/security">
      <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
      <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
      <FilterSelect name="userId" defaultValue={params.userId} placeholder="Все пользователи">
        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
      </FilterSelect>
      <FilterSelect
        name="action"
        defaultValue={params.action}
        placeholder="Все события"
        options={actions.map((value) => ({ value, label: securityActionLabels[value] ?? value }))}
      />
      <FilterSelect
        name="severity"
        defaultValue={params.severity}
        placeholder="Все уровни"
        options={Object.entries(securitySeverityLabels).map(([value, label]) => ({ value, label }))}
      />
      <FilterActions className="lg:col-span-5">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/security">Сбросить</Link></Button>
        <Button asChild variant="outline"><Link href="/api/security/export-all">Экспорт всей базы</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
