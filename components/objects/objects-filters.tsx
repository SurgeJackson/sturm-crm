import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterSelect, FilterShortcutButtons } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { objectStageOptions, objectStatusOptions, objectTypeOptions } from "@/modules/crm/options";
import type { ObjectListSearchParams } from "@/modules/objects/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

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
      <FilterSelect name="objectType" defaultValue={params.objectType} placeholder="Все типы" options={objectTypeOptions} />
      <FilterSelect name="stage" defaultValue={params.stage} placeholder="Все стадии" options={objectStageOptions} />
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={objectStatusOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterSelect name="clientId" defaultValue={params.clientId} placeholder="Все клиенты">
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </FilterSelect>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </FilterSelect>
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="title">По названию</option>
        <option value="implementationStartAt">По сроку реализации</option>
      </FilterSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/objects">Сбросить</Link></Button>
        <FilterShortcutButtons
          basePath="/objects"
          params={params}
          shortcuts={[
            { label: "Без дизайнера", patch: { noDesigner: "1", page: undefined } },
            { label: "Без участников", patch: { noParticipants: "1", page: undefined } },
            { label: "Без задач", patch: { noTasks: "1", page: undefined } },
            { label: "В расчете", patch: { stage: "CALCULATION", page: undefined } },
            { label: "В согласовании", patch: { stage: "APPROVAL", page: undefined } },
            { label: "Замороженные", patch: { frozen: "1", page: undefined } },
            { label: "Потерянные", patch: { lost: "1", page: undefined } }
          ]}
        />
      </FilterActions>
    </FilterBar>
  );
}
