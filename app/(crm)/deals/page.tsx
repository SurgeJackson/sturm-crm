import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealStageLabels,
  dealSourceLabels
} from "@/lib/constants";
import {
  dealProbabilityOptions,
  dealSourceOptions,
  dealStageOptions
} from "@/modules/crm/options";
import { getDeals, type DealListSearchParams } from "@/modules/deals/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { prisma } from "@/lib/prisma";
import { canCreateDeal } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type DealsPageProps = {
  searchParams: Promise<DealListSearchParams>;
};

function currentUrl(params: DealListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/deals?${next.toString()}`;
}

function formatMoney(value?: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : "Без суммы";
}

function isOverdue(date?: Date | null, stage?: string) {
  return Boolean(date && date < new Date() && stage !== "LOST" && stage !== "COMPLETED");
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [deals, users, clients, objects, designers] = await Promise.all([
    getDeals(params, user),
    getAssignableUsers(),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.projectObject.findMany({ where: { archivedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.designer.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, studio: true } })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Сделки</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Воронка продаж по клиентам, объектам и дизайнерам.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/deals/pipeline">Воронка</Link></Button>
          {canCreateDeal(user) ? (
            <Button asChild>
              <Link href="/deals/new">
                <Plus className="h-4 w-4" />
                Создать сделку
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по сделке, клиенту, объекту" />
            </div>
            <select name="stage" defaultValue={params.stage ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все стадии</option>
              {dealStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="responsibleId" defaultValue={params.responsibleId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все ответственные</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="clientId" defaultValue={params.clientId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все клиенты</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <select name="objectId" defaultValue={params.objectId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все объекты</option>
              {objects.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
            </select>
            <select name="designerId" defaultValue={params.designerId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все дизайнеры</option>
              {designers.map((designer) => (
                <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
              ))}
            </select>
            <select name="source" defaultValue={params.source ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все источники</option>
              {dealSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="probability" defaultValue={params.probability ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все вероятности</option>
              {dealProbabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="sort" defaultValue={params.sort ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Сначала новые</option>
              <option value="title">По названию</option>
              <option value="nextActionAt">По следующему действию</option>
              <option value="potentialAmount">По сумме</option>
            </select>
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <Button type="submit" variant="secondary">Применить</Button>
              <Button asChild variant="outline"><Link href="/deals">Сбросить</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noNextAction: "1", page: undefined })}>Без следующего шага</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { overdueNextAction: "1", page: undefined })}>Просроченные</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "WAITING_DECISION", page: undefined })}>Ожидание решения</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "NEGOTIATION", page: undefined })}>На согласовании</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noAmount: "1", page: undefined })}>Без суммы</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { highProbability: "1", page: undefined })}>Высокая вероятность</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { lost: "1", page: undefined })}>Проигранные</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { active: "1", page: undefined })}>Активные</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сделка</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Стадия</TableHead>
                <TableHead>Вероятность</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Следующее действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center text-sm text-muted-foreground">Сделки не найдены.</TableCell>
                </TableRow>
              ) : (
                deals.items.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link>
                      <div className="text-xs text-muted-foreground">{dealSourceLabels[deal.source]}</div>
                    </TableCell>
                    <TableCell><Link href={`/clients/${deal.client.id}`} className="hover:underline">{deal.client.name}</Link></TableCell>
                    <TableCell><Link href={`/objects/${deal.projectObject.id}`} className="hover:underline">{deal.projectObject.title}</Link></TableCell>
                    <TableCell>{deal.responsible.name}</TableCell>
                    <TableCell><Badge variant={deal.stage === "LOST" ? "warning" : "outline"}>{dealStageLabels[deal.stage]}</Badge></TableCell>
                    <TableCell>
                      {deal.probability ? (
                        <Badge variant={deal.probability === "HIGH" || deal.probability === "VERY_HIGH" ? "secondary" : "outline"}>
                          {dealProbabilityLabels[deal.probability]} · {dealProbabilityPercent[deal.probability]}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Не выбрана</span>
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(deal.potentialAmount)}</TableCell>
                    <TableCell>
                      <div className={isOverdue(deal.nextActionAt, deal.stage) ? "text-warning" : ""}>
                        {formatRussianDate(deal.nextActionAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">{deal.nextActionText || "Нет шага"}</div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {deals.total}</span>
        <div className="flex gap-2">
          {deals.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={currentUrl(params, { page: String(deals.page - 1) })}>Назад</Link>
            </Button>
          ) : null}
          <span className="py-2">Страница {deals.page} из {deals.pageCount}</span>
          {deals.page < deals.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={currentUrl(params, { page: String(deals.page + 1) })}>Вперед</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
