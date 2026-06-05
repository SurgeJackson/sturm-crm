import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { CrmDisciplineBadge } from "@/components/crm/crm-discipline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels
} from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { getDesigners, type DesignerListSearchParams } from "@/modules/designers/queries";
import {
  designerLoyaltyOptions,
  designerPotentialOptions,
  designerRelationshipStageOptions,
  designerRoleOptions
} from "@/modules/crm/options";
import { getAssignableUsers } from "@/modules/users/queries";
import { canCreateDesigner } from "@/permissions";

type DesignersPageProps = {
  searchParams: Promise<DesignerListSearchParams>;
};

function pageHref(params: DesignerListSearchParams, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  search.set("page", String(page));
  return `/designers?${search.toString()}`;
}

function isOverdue(date?: Date | null) {
  return Boolean(date && new Date(date).getTime() < Date.now());
}

export default async function DesignersPage({ searchParams }: DesignersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [designers, users] = await Promise.all([getDesigners(params, user), getAssignableUsers()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Дизайнеры / архитекторы</h1>
          <p className="mt-1 text-sm text-muted-foreground">Партнерская база и воронка отношений.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/designers/pipeline">Воронка</Link></Button>
          {canCreateDesigner(user) ? (
            <Button asChild>
              <Link href="/designers/new">
                <Plus className="h-4 w-4" />
                Создать дизайнера
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Фильтры</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="role" defaultValue={params.role ?? ""}>
              <option value="">Все роли</option>
              {designerRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="relationshipStage" defaultValue={params.relationshipStage ?? ""}>
              <option value="">Все этапы</option>
              {designerRelationshipStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="potential" defaultValue={params.potential ?? ""}>
              <option value="">Любой потенциал</option>
              {designerPotentialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="loyalty" defaultValue={params.loyalty ?? ""}>
              <option value="">Любая лояльность</option>
              {designerLoyaltyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noNextStep" value="1" defaultChecked={params.noNextStep === "1"} />
              Без следующего шага
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noTouch60" value="1" defaultChecked={params.noTouch60 === "1"} />
              Без касаний 60+ дней
            </label>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="name">По имени</option>
              <option value="nextStepAt">По следующему шагу</option>
            </select>
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit">Применить</Button>
              <Button asChild variant="outline"><Link href="/designers">Сбросить</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {designers.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Дизайнеры не найдены.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дизайнер</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Этап</TableHead>
                  <TableHead>Потенциал</TableHead>
                  <TableHead>Лояльность</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Следующий шаг</TableHead>
                  <TableHead>CRM-дисциплина</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designers.items.map((designer) => (
                  <TableRow key={designer.id}>
                    <TableCell>
                      <Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link>
                      <div className="text-xs text-muted-foreground">{designer.studio ?? designer.city ?? "Нет студии"}</div>
                    </TableCell>
                    <TableCell>{designerRoleLabels[designer.role]}</TableCell>
                    <TableCell><Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge></TableCell>
                    <TableCell><Badge variant={designer.potential === "A" ? "warning" : "outline"}>{designerPotentialLabels[designer.potential]}</Badge></TableCell>
                    <TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell>
                    <TableCell>{designer.responsible.name}</TableCell>
                    <TableCell>
                      <span className={isOverdue(designer.nextStepAt) ? "text-destructive" : ""}>{formatRussianDate(designer.nextStepAt)}</span>
                      <div className="text-xs text-muted-foreground">{designer.nextStepText ?? "Не указан"}</div>
                    </TableCell>
                    <TableCell><CrmDisciplineBadge violations={designer.crmViolations} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {designers.total}</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href={pageHref(params, Math.max(designers.page - 1, 1))}>Назад</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={pageHref(params, Math.min(designers.page + 1, designers.pageCount))}>Вперед</Link></Button>
        </div>
      </div>
    </div>
  );
}
