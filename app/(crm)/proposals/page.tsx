import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/crm-discipline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import { getProposals, type ProposalListSearchParams } from "@/modules/proposals/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { prisma } from "@/lib/prisma";
import { canCreateProposal } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type ProposalsPageProps = {
  searchParams: Promise<ProposalListSearchParams>;
};

function currentUrl(params: ProposalListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/proposals?${next.toString()}`;
}

function formatMoney(value?: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : "0 ₽";
}

function statusVariant(status: keyof typeof commercialProposalStatusLabels) {
  if (status === "DECLINED" || status === "ARCHIVED") return "warning" as const;
  if (status === "ACCEPTED" || status === "SENT") return "secondary" as const;
  return "outline" as const;
}

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [proposals, users, clients, objects, deals, designers] = await Promise.all([
    getProposals(params, user),
    getAssignableUsers(),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.projectObject.findMany({ where: { archivedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.deal.findMany({ where: { archivedAt: null }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.designer.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, studio: true } })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">КП</h1>
          <p className="mt-1 text-sm text-muted-foreground">Коммерческие предложения, версии, файлы и follow-up.</p>
        </div>
        {canCreateProposal(user) ? (
          <Button asChild>
            <Link href="/proposals/new">
              <Plus className="h-4 w-4" />
              Создать КП
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по номеру, клиенту, объекту, сделке" />
            </div>
            <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все статусы</option>
              {commercialProposalStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
            <select name="dealId" defaultValue={params.dealId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все сделки</option>
              {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
            </select>
            <select name="designerId" defaultValue={params.designerId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все дизайнеры</option>
              {designers.map((designer) => (
                <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
              ))}
            </select>
            <select name="sort" defaultValue={params.sort ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Сначала новые</option>
              <option value="proposalNumber">По номеру</option>
              <option value="amount">По сумме</option>
              <option value="nextTouchAt">По follow-up</option>
            </select>
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <Button type="submit" variant="secondary">Применить</Button>
              <Button asChild variant="outline"><Link href="/proposals">Сбросить</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noFile: "1", page: undefined })}>Без файла</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noFollowUp: "1", page: undefined })}>Без follow-up</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { overdueFollowUp: "1", page: undefined })}>Просроченный follow-up</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { thinking7: "1", page: undefined })}>Думает 7+ дней</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { internalReview: "1", page: undefined })}>На проверке</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { needsRecalculation: "1", page: undefined })}>Требуется пересчет</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { accepted: "1", page: undefined })}>Принятые</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { declined: "1", page: undefined })}>Отклоненные</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>КП</TableHead>
                <TableHead>Сделка</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Версия</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Отправлено</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Файл</TableHead>
                <TableHead>CRM-дисциплина</TableHead>
                <TableHead>Учет в премии</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.items.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="h-28 text-center text-sm text-muted-foreground">КП не найдены.</TableCell></TableRow>
              ) : (
                proposals.items.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">{proposal.proposalNumber}</Link>
                      <div className="text-xs text-muted-foreground">{proposal.projectObject.title}</div>
                    </TableCell>
                    <TableCell><Link href={`/deals/${proposal.deal.id}`} className="hover:underline">{proposal.deal.title}</Link></TableCell>
                    <TableCell><Link href={`/clients/${proposal.client.id}`} className="hover:underline">{proposal.client.name}</Link></TableCell>
                    <TableCell><Badge variant={statusVariant(proposal.status)}>{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
                    <TableCell>v{proposal.version}</TableCell>
                    <TableCell>{formatMoney(proposal.amount)}</TableCell>
                    <TableCell>{formatRussianDate(proposal.sentAt)}</TableCell>
                    <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
                    <TableCell>{proposal.fileUrl ? <Link className="hover:underline" href={proposal.fileUrl}>Скачать</Link> : "Нет файла"}</TableCell>
                    <TableCell><CrmDisciplineBadge violations={proposal.crmViolations} /></TableCell>
                    <TableCell><BonusEligibilityBadge violations={proposal.crmViolations} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {proposals.total}</span>
        <div className="flex gap-2">
          {proposals.page > 1 ? <Button asChild variant="outline" size="sm"><Link href={currentUrl(params, { page: String(proposals.page - 1) })}>Назад</Link></Button> : null}
          <span className="py-2">Страница {proposals.page} из {proposals.pageCount}</span>
          {proposals.page < proposals.pageCount ? <Button asChild variant="outline" size="sm"><Link href={currentUrl(params, { page: String(proposals.page + 1) })}>Вперед</Link></Button> : null}
        </div>
      </div>
    </div>
  );
}
