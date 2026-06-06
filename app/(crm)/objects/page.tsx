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
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels
} from "@/lib/constants";
import {
  objectStageOptions,
  objectStatusOptions,
  objectTypeOptions
} from "@/modules/crm/options";
import { getProjectObjects, type ObjectListSearchParams } from "@/modules/objects/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { prisma } from "@/lib/prisma";
import { canCreateObject } from "@/permissions";

type ObjectsPageProps = {
  searchParams: Promise<ObjectListSearchParams>;
};

function currentUrl(params: ObjectListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/objects?${next.toString()}`;
}

function statusVariant(status: keyof typeof objectStatusLabels) {
  if (status === "LOST" || status === "ARCHIVED") return "warning" as const;
  if (status === "FROZEN") return "warning" as const;
  return "secondary" as const;
}

export default async function ObjectsPage({ searchParams }: ObjectsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [objects, users, clients, designers] = await Promise.all([
    getProjectObjects(params, user),
    getAssignableUsers(),
    prisma.client.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.designer.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, studio: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Объекты"
        description="Проектные продажи, комплектации и контроль участников объекта."
        actions={canCreateObject(user) ? (
          <Button asChild>
            <Link href="/objects/new">
              <Plus className="h-4 w-4" />
              Создать объект
            </Link>
          </Button>
        ) : null}
      />

      <FilterBar className="lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, адресу, городу" />
            </div>
            <NativeSelect name="objectType" defaultValue={params.objectType ?? ""}>
              <option value="">Все типы</option>
              {objectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="stage" defaultValue={params.stage ?? ""}>
              <option value="">Все стадии</option>
              {objectStageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {objectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="clientId" defaultValue={params.clientId ?? ""}>
              <option value="">Все клиенты</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </NativeSelect>
            <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}>
              <option value="">Все дизайнеры</option>
              {designers.map((designer) => (
                <option key={designer.id} value={designer.id}>
                  {designer.name}{designer.studio ? `, ${designer.studio}` : ""}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="title">По названию</option>
              <option value="implementationStartAt">По сроку реализации</option>
            </NativeSelect>
            <FilterActions className="lg:col-span-4">
              <Button type="submit" variant="secondary">Применить</Button>
              <Button asChild variant="outline"><Link href="/objects">Сбросить</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noResponsible: "1", page: undefined })}>Без ответственного</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noClient: "1", page: undefined })}>Без клиента</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noDesigner: "1", page: undefined })}>Без дизайнера</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noTasks: "1", page: undefined })}>Без задач</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "CALCULATION", page: undefined })}>В расчете</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "APPROVAL", page: undefined })}>В согласовании</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { frozen: "1", page: undefined })}>Замороженные</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { lost: "1", page: undefined })}>Потерянные</Link></Button>
            </FilterActions>
      </FilterBar>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Объект</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дизайнер</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Стадия</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>CRM-дисциплина</TableHead>
                <TableHead>Учет в премии</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-sm text-muted-foreground">
                    Объекты не найдены.
                  </TableCell>
                </TableRow>
              ) : (
                objects.items.map((object) => (
                  <TableRow key={object.id}>
                    <TableCell>
                      <Link href={`/objects/${object.id}`} className="font-medium hover:underline">
                        {object.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {[object.city, object.address].filter(Boolean).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
                    <TableCell>
                      <Link className="hover:underline" href={`/clients/${object.client.id}`}>{object.client.name}</Link>
                    </TableCell>
                    <TableCell>
                      {object.designer ? (
                        <Link className="hover:underline" href={`/designers/${object.designer.id}`}>{object.designer.name}</Link>
                      ) : (
                        <span className="text-muted-foreground">Не выбран</span>
                      )}
                    </TableCell>
                    <TableCell>{object.responsible.name}</TableCell>
                    <TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(object.status)}>{objectStatusLabels[object.status]}</Badge></TableCell>
                    <TableCell><CrmDisciplineBadge violations={object.crmViolations} /></TableCell>
                    <TableCell><BonusEligibilityBadge violations={object.crmViolations} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        total={objects.total}
        page={objects.page}
        pageCount={objects.pageCount}
        previousHref={objects.page > 1 ? currentUrl(params, { page: String(objects.page - 1) }) : undefined}
        nextHref={objects.page < objects.pageCount ? currentUrl(params, { page: String(objects.page + 1) }) : undefined}
      />
    </div>
  );
}
