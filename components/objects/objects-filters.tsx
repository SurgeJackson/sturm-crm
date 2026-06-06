import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { objectStageOptions, objectStatusOptions, objectTypeOptions } from "@/modules/crm/options";
import type { ObjectListSearchParams } from "@/modules/objects/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

function currentUrl(params: ObjectListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/objects?${next.toString()}`;
}

export function ObjectsFilters({
  params,
  users,
  clients,
  designers
}: {
  params: ObjectListSearchParams;
  users: Option[];
  clients: Option[];
  designers: DesignerOption[];
}) {
  return (
    <FilterBar className="lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, адресу, городу" />
      </div>
      <NativeSelect name="objectType" defaultValue={params.objectType ?? ""}>
        <option value="">Все типы</option>
        {objectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="stage" defaultValue={params.stage ?? ""}>
        <option value="">Все стадии</option>
        {objectStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="status" defaultValue={params.status ?? ""}>
        <option value="">Все статусы</option>
        {objectStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </NativeSelect>
      <NativeSelect name="clientId" defaultValue={params.clientId ?? ""}>
        <option value="">Все клиенты</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </NativeSelect>
      <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}>
        <option value="">Все дизайнеры</option>
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
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
  );
}
