import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import { objectStatusVariant } from "@/components/crm/status-variants";
import { BadgeCell, EmptyTableRow, EntityLinkCell, MutedCell, TableCard, TextLinkCell } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { objectStageLabels, objectStatusLabels, objectTypeLabels } from "@/lib/constants";
import type { getProjectObjects } from "@/modules/objects/queries";

type ObjectItem = Awaited<ReturnType<typeof getProjectObjects>>["items"][number];

export function ObjectsTable({ objects }: { objects: ObjectItem[] }) {
  return (
    <TableCard>
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
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={9}>Объекты не найдены.</EmptyTableRow>
        ) : (
          objects.map((object) => (
            <TableRow key={object.id}>
              <EntityLinkCell
                href={`/objects/${object.id}`}
                title={object.title}
                description={[object.city, object.address].filter(Boolean).join(", ")}
              />
              <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
              <TextLinkCell href={`/clients/${object.client.id}`}>{object.client.name}</TextLinkCell>
              {object.designer ? (
                <TextLinkCell href={`/designers/${object.designer.id}`}>{object.designer.name}</TextLinkCell>
              ) : (
                <MutedCell>Не выбран</MutedCell>
              )}
              <TableCell>{object.responsible.name}</TableCell>
              <BadgeCell>{objectStageLabels[object.stage]}</BadgeCell>
              <BadgeCell variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
              <TableCell><CrmDisciplineBadge violations={object.crmViolations} /></TableCell>
              <TableCell><BonusEligibilityBadge violations={object.crmViolations} /></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
