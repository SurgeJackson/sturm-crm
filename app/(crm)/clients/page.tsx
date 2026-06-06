import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientSourceLabels, clientStatusLabels, clientTypeLabels } from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { getClients, type ClientListSearchParams } from "@/modules/clients/queries";
import { clientSourceOptions, clientStatusOptions, clientTypeOptions } from "@/modules/crm/options";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/crm-discipline";
import { getAssignableUsers } from "@/modules/users/queries";
import { canCreateClient } from "@/permissions";

type ClientsPageProps = {
  searchParams: Promise<ClientListSearchParams>;
};

function pageHref(params: ClientListSearchParams, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  search.set("page", String(page));
  return `/clients?${search.toString()}`;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [clients, users] = await Promise.all([getClients(params, user), getAssignableUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клиенты"
        description="База клиентов STURM с ответственными и следующим контактом."
        actions={canCreateClient(user) ? (
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Создать клиента
            </Link>
          </Button>
        ) : null}
      />

      <FilterBar className="md:grid-cols-3 xl:grid-cols-6">
            <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
            <NativeSelect name="clientType" defaultValue={params.clientType ?? ""}>
              <option value="">Все типы</option>
              {clientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="source" defaultValue={params.source ?? ""}>
              <option value="">Все источники</option>
              {clientSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {clientStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </NativeSelect>
            <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="name">По названию</option>
              <option value="nextContactAt">По следующему контакту</option>
            </NativeSelect>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noNextContact" value="1" defaultChecked={params.noNextContact === "1"} />
              Без следующего контакта
            </label>
            <FilterActions className="md:col-span-2 xl:col-span-5">
              <Button type="submit">Применить</Button>
              <Button asChild variant="outline"><Link href="/clients">Сбросить</Link></Button>
            </FilterActions>
      </FilterBar>

      <Card>
        <CardContent className="pt-5">
          {clients.items.length === 0 ? (
            <EmptyState title="Клиенты не найдены" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Тип / источник</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Следующий контакт</TableHead>
                  <TableHead>CRM-дисциплина</TableHead>
                  <TableHead>Учет в премии</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.items.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="font-medium hover:underline">{client.name}</Link>
                      <div className="text-xs text-muted-foreground">{client.city ?? "Город не указан"}</div>
                    </TableCell>
                    <TableCell>
                      <div>{client.phone ?? client.messenger ?? "Нет контакта"}</div>
                      <div className="text-xs text-muted-foreground">{client.email ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <div>{clientTypeLabels[client.clientType]}</div>
                      <div className="text-xs text-muted-foreground">{clientSourceLabels[client.source]}</div>
                    </TableCell>
                    <TableCell><Badge variant={client.status === "ARCHIVED" ? "outline" : "secondary"}>{clientStatusLabels[client.status]}</Badge></TableCell>
                    <TableCell>{client.responsible.name}</TableCell>
                    <TableCell>{formatRussianDate(client.nextContactAt)}</TableCell>
                    <TableCell><CrmDisciplineBadge violations={client.crmViolations} /></TableCell>
                    <TableCell><BonusEligibilityBadge violations={client.crmViolations} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination
        total={clients.total}
        page={clients.page}
        pageCount={clients.pageCount}
        previousHref={clients.page > 1 ? pageHref(params, clients.page - 1) : undefined}
        nextHref={clients.page < clients.pageCount ? pageHref(params, clients.page + 1) : undefined}
      />
    </div>
  );
}
