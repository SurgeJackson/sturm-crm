import {
  BadgeCell,
  CountCell,
  DateCell,
  EntityLinkCell,
  EmptyTableRow,
  TableCard
} from "@/components/ui/data-table";
import { designerPotentialVariant, objectStatusVariant } from "@/components/crm/status-variants";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels
} from "@/lib/constants";
import type { getDesignersReport, getObjectsReport } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type DesignersReport = Awaited<ReturnType<typeof getDesignersReport>>;
type ObjectsReport = Awaited<ReturnType<typeof getObjectsReport>>;

export function DesignersReportTable({ designers }: { designers: DesignersReport["designers"] }) {
  return (
    <TableCard title="Дизайнеры">
      <TableHeader>
        <TableRow>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Этап</TableHead>
          <TableHead>Потенциал</TableHead>
          <TableHead>Лояльность</TableHead>
          <TableHead>Объекты</TableHead>
          <TableHead>КП</TableHead>
          <TableHead>Последнее касание</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {designers.length === 0 ? (
          <EmptyTableRow colSpan={7}>Дизайнеры не найдены.</EmptyTableRow>
        ) : designers.map((designer) => (
          <TableRow key={designer.id}>
            <EntityLinkCell
              cellLabel="Дизайнер"
              href={`/designers/${designer.id}`}
              title={designer.name}
              description={designer.studio}
            />
            <BadgeCell cellLabel="Этап">{designerRelationshipStageLabels[designer.relationshipStage]}</BadgeCell>
            <BadgeCell cellLabel="Потенциал" variant={designerPotentialVariant(designer.potential)}>
              {designerPotentialLabels[designer.potential]}
            </BadgeCell>
            <TableCell label="Лояльность">{designerLoyaltyLabels[designer.loyalty]}</TableCell>
            <CountCell cellLabel="Объекты" value={designer.projectObjects.length} />
            <CountCell cellLabel="КП" value={designer.proposals.length} />
            <DateCell cellLabel="Последнее касание">{formatRussianDate(designer.lastTouchAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ObjectsReportTable({ objects }: { objects: ObjectsReport["objects"] }) {
  return (
    <TableCard title="Объекты">
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Задачи</TableHead>
          <TableHead>Участники</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={8}>Объекты не найдены.</EmptyTableRow>
        ) : objects.map((object) => (
          <TableRow key={object.id}>
            <EntityLinkCell cellLabel="Объект" href={`/objects/${object.id}`} title={object.title} />
            <TableCell label="Тип">{objectTypeLabels[object.objectType]}</TableCell>
            <BadgeCell cellLabel="Стадия">{objectStageLabels[object.stage]}</BadgeCell>
            <BadgeCell cellLabel="Статус" variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
            <TableCell label="Клиент">{object.client.name}</TableCell>
            <TableCell label="Дизайнер">{object.designer?.name ?? "Нет"}</TableCell>
            <CountCell cellLabel="Задачи" value={object.tasks.length} />
            <CountCell cellLabel="Участники" value={object.participants.length} />
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
