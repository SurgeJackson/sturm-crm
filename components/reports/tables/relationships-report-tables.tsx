import {
  BadgeCell,
  EntityLinkCell,
  EmptyTableRow,
  TableCard
} from "@/components/ui/data-table";
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
              href={`/designers/${designer.id}`}
              title={designer.name}
              description={designer.studio}
            />
            <BadgeCell>{designerRelationshipStageLabels[designer.relationshipStage]}</BadgeCell>
            <TableCell>{designerPotentialLabels[designer.potential]}</TableCell>
            <TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell>
            <TableCell>{designer.projectObjects.length}</TableCell>
            <TableCell>{designer.proposals.length}</TableCell>
            <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
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
            <EntityLinkCell href={`/objects/${object.id}`} title={object.title} />
            <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
            <BadgeCell>{objectStageLabels[object.stage]}</BadgeCell>
            <TableCell>{objectStatusLabels[object.status]}</TableCell>
            <TableCell>{object.client.name}</TableCell>
            <TableCell>{object.designer?.name ?? "Нет"}</TableCell>
            <TableCell>{object.tasks.length}</TableCell>
            <TableCell>{object.participants.length}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
