import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { CrmDisciplineBadge } from "@/components/crm/crm-discipline";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
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
      <PageHeader
        title="Дизайнеры / архитекторы"
        description="Партнерская база и воронка отношений."
        actions={
          <>
          <Button asChild variant="outline"><Link href="/designers/pipeline">Воронка</Link></Button>
          {canCreateDesigner(user) ? (
            <Button asChild>
              <Link href="/designers/new">
                <Plus className="h-4 w-4" />
                Создать дизайнера
              </Link>
            </Button>
          ) : null}
          </>
        }
      />

      <FilterBar className="md:grid-cols-3 xl:grid-cols-6">
            <input className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
            <NativeSelect name="role" defaultValue={params.role ?? ""}>
              <option value="">Все роли</option>
              {designerRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="relationshipStage" defaultValue={params.relationshipStage ?? ""}>
              <option value="">Все этапы</option>
              {designerRelationshipStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="potential" defaultValue={params.potential ?? ""}>
              <option value="">Любой потенциал</option>
              {designerPotentialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="loyalty" defaultValue={params.loyalty ?? ""}>
              <option value="">Любая лояльность</option>
              {designerLoyaltyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
            </NativeSelect>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noNextStep" value="1" defaultChecked={params.noNextStep === "1"} />
              Без следующего шага
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="noTouch60" value="1" defaultChecked={params.noTouch60 === "1"} />
              Без касаний 60+ дней
            </label>
            <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="name">По имени</option>
              <option value="nextStepAt">По следующему шагу</option>
            </NativeSelect>
            <FilterActions className="md:col-span-3">
              <Button type="submit">Применить</Button>
              <Button asChild variant="outline"><Link href="/designers">Сбросить</Link></Button>
            </FilterActions>
      </FilterBar>

      <Card>
        <CardContent className="pt-5">
          {designers.items.length === 0 ? (
            <EmptyState title="Дизайнеры не найдены" />
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

      <Pagination
        total={designers.total}
        page={designers.page}
        pageCount={designers.pageCount}
        previousHref={designers.page > 1 ? pageHref(params, designers.page - 1) : undefined}
        nextHref={designers.page < designers.pageCount ? pageHref(params, designers.page + 1) : undefined}
      />
    </div>
  );
}
