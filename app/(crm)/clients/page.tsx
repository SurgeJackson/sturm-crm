import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientSourceLabels, clientStatusLabels, clientTypeLabels } from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { getClients, type ClientListSearchParams } from "@/modules/clients/queries";
import { clientSourceOptions, clientStatusOptions, clientTypeOptions } from "@/modules/crm/options";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Клиенты</h1>
          <p className="mt-1 text-sm text-muted-foreground">База клиентов STURM с ответственными и следующим контактом.</p>
        </div>
        {canCreateClient(user) ? (
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Создать клиента
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="clientType" defaultValue={params.clientType ?? ""}>
              <option value="">Все типы</option>
              {clientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="source" defaultValue={params.source ?? ""}>
              <option value="">Все источники</option>
              {clientSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {clientStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="name">По названию</option>
              <option value="nextContactAt">По следующему контакту</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noNextContact" value="1" defaultChecked={params.noNextContact === "1"} />
              Без следующего контакта
            </label>
            <div className="flex gap-2 md:col-span-2 xl:col-span-5">
              <Button type="submit">Применить</Button>
              <Button asChild variant="outline"><Link href="/clients">Сбросить</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {clients.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Клиенты не найдены.</div>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {clients.total}</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={clients.page <= 1}>
            <Link href={pageHref(params, Math.max(clients.page - 1, 1))}>Назад</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={clients.page >= clients.pageCount}>
            <Link href={pageHref(params, Math.min(clients.page + 1, clients.pageCount))}>Вперед</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
