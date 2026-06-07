import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FilterActions,
  FilterBar,
  FilterCheckbox,
  FilterSearchInput,
  FilterSelect,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import {
  designerLoyaltyOptions,
  designerPotentialOptions,
  designerRelationshipStageOptions,
  designerRoleOptions
} from "@/modules/crm/options";
import type { DesignerListSearchParams } from "@/modules/designers/queries";

type UserOption = { id: string; name: string };

const sortLabels: Record<string, string> = {
  name: "По имени",
  nextStepAt: "По следующему шагу"
};

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function DesignersFilters({ params, users }: { params: DesignerListSearchParams; users: UserOption[] }) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/designers", params, { q: undefined, page: undefined }) } : null,
    params.role ? { key: "role", label: "Роль", value: optionLabel(designerRoleOptions, params.role), href: filterShortcutHref("/designers", params, { role: undefined, page: undefined }) } : null,
    params.relationshipStage ? { key: "relationshipStage", label: "Этап", value: optionLabel(designerRelationshipStageOptions, params.relationshipStage), href: filterShortcutHref("/designers", params, { relationshipStage: undefined, page: undefined }) } : null,
    params.potential ? { key: "potential", label: "Потенциал", value: optionLabel(designerPotentialOptions, params.potential), href: filterShortcutHref("/designers", params, { potential: undefined, page: undefined }) } : null,
    params.loyalty ? { key: "loyalty", label: "Лояльность", value: optionLabel(designerLoyaltyOptions, params.loyalty), href: filterShortcutHref("/designers", params, { loyalty: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/designers", params, { responsibleId: undefined, page: undefined }) } : null,
    params.sort ? { key: "sort", label: "Сортировка", value: sortLabels[params.sort] ?? params.sort, href: filterShortcutHref("/designers", params, { sort: undefined, page: undefined }) } : null,
    params.noNextStep === "1" ? { key: "noNextStep", label: "Шаг", value: "Без следующего шага", href: filterShortcutHref("/designers", params, { noNextStep: undefined, page: undefined }) } : null,
    params.noTouch60 === "1" ? { key: "noTouch60", label: "Касания", value: "Нет 60+ дней", href: filterShortcutHref("/designers", params, { noTouch60: undefined, page: undefined }) } : null,
    params.archived === "1" ? { key: "archived", label: "Архив", value: "Архивные", href: filterShortcutHref("/designers", params, { archived: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="md:grid-cols-3 xl:grid-cols-6" activeFilters={activeFilters} resetHref="/designers">
      <FilterSearchInput defaultValue={params.q} />
      <FilterSelect name="role" defaultValue={params.role} placeholder="Все роли" options={designerRoleOptions} />
      <FilterSelect name="relationshipStage" defaultValue={params.relationshipStage} placeholder="Все этапы" options={designerRelationshipStageOptions} />
      <FilterSelect name="potential" defaultValue={params.potential} placeholder="Любой потенциал" options={designerPotentialOptions} />
      <FilterSelect name="loyalty" defaultValue={params.loyalty} placeholder="Любая лояльность" options={designerLoyaltyOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
      </FilterSelect>
      <FilterCheckbox name="noNextStep" defaultChecked={params.noNextStep === "1"}>
        Без следующего шага
      </FilterCheckbox>
      <FilterCheckbox name="noTouch60" defaultChecked={params.noTouch60 === "1"}>
        Без касаний 60+ дней
      </FilterCheckbox>
      <FilterCheckbox name="archived" defaultChecked={params.archived === "1"}>Архивные</FilterCheckbox>
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="name">По имени</option>
        <option value="nextStepAt">По следующему шагу</option>
      </FilterSelect>
      <FilterActions className="md:col-span-3">
        <Button type="submit">Применить</Button>
        <Button asChild variant="outline"><Link href="/designers">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
