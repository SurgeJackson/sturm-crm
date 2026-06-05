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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Объекты</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Проектные продажи, комплектации и контроль участников объекта.
          </p>
        </div>
        {canCreateObject(user) ? (
          <Button asChild>
            <Link href="/objects/new">
              <Plus className="h-4 w-4" />
              Создать объект
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, адресу, городу" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="objectType" defaultValue={params.objectType ?? ""}>
              <option value="">Все типы</option>
              {objectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="stage" defaultValue={params.stage ?? ""}>
              <option value="">Все стадии</option>
              {objectStageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {objectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="clientId" defaultValue={params.clientId ?? ""}>
              <option value="">Все клиенты</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="designerId" defaultValue={params.designerId ?? ""}>
              <option value="">Все дизайнеры</option>
              {designers.map((designer) => (
                <option key={designer.id} value={designer.id}>
                  {designer.name}{designer.studio ? `, ${designer.studio}` : ""}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="sort" defaultValue={params.sort ?? ""}>
              <option value="">Сначала новые</option>
              <option value="title">По названию</option>
              <option value="implementationStartAt">По сроку реализации</option>
            </select>
            <div className="flex flex-wrap gap-2 lg:col-span-4">
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
            </div>
          </form>
        </CardContent>
      </Card>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {objects.total}</span>
        <div className="flex gap-2">
          {objects.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={currentUrl(params, { page: String(objects.page - 1) })}>Назад</Link>
            </Button>
          ) : null}
          <span className="py-2">Страница {objects.page} из {objects.pageCount}</span>
          {objects.page < objects.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={currentUrl(params, { page: String(objects.page + 1) })}>Вперед</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
