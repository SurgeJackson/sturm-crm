import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/crm-discipline";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
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
      <PageHeader
        title="Сделки"
        description="Воронка продаж по клиентам, объектам и дизайнерам."
        actions={
          <>
          <Button asChild variant="outline"><Link href="/deals/pipeline">Воронка</Link></Button>
          {canCreateDeal(user) ? (
            <Button asChild>
              <Link href="/deals/new">
                <Plus className="h-4 w-4" />
                Создать сделку
              </Link>
            </Button>
          ) : null}
          </>
        }
      />

      <FilterBar className="lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по сделке, клиенту, объекту" />
            </div>
            <NativeSelect name="stage" defaultValue={params.stage ?? ""}>
              <option value="">Все стадии</option>
              {dealStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </NativeSelect>
            <NativeSelect name="clientId" defaultValue={params.clientId ?? ""}>
              <option value="">Все клиенты</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </NativeSelect>
            <NativeSelect name="objectId" defaultValue={params.objectId ?? ""}>
              <option value="">Все объекты</option>
              {objects.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
            </NativeSelect>
            <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}>
              <option value="">Все дизайнеры</option>
              {designers.map((designer) => (
                <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="source" defaultValue={params.source ?? ""}>
              <option value="">Все источники</option>
              {dealSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="probability" defaultValue={params.probability ?? ""}>
              <option value="">Все вероятности</option>
              {dealProbabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="title">По названию</option>
              <option value="nextActionAt">По следующему действию</option>
              <option value="potentialAmount">По сумме</option>
            </NativeSelect>
            <FilterActions className="lg:col-span-4">
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
            </FilterActions>
      </FilterBar>

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
                <TableHead>CRM-дисциплина</TableHead>
                <TableHead>Учет в премии</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">Сделки не найдены.</TableCell>
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
                    <TableCell><CrmDisciplineBadge violations={deal.crmViolations} /></TableCell>
                    <TableCell><BonusEligibilityBadge violations={deal.crmViolations} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        total={deals.total}
        page={deals.page}
        pageCount={deals.pageCount}
        previousHref={deals.page > 1 ? currentUrl(params, { page: String(deals.page - 1) }) : undefined}
        nextHref={deals.page < deals.pageCount ? currentUrl(params, { page: String(deals.page + 1) }) : undefined}
      />
    </div>
  );
}
