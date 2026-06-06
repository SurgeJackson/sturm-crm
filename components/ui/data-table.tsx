import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableEmptyRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/money";

export function TableCard({
  title,
  actions,
  children
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      {title || actions ? (
        <CardHeader className={actions ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : undefined}>
          {title ? <CardTitle>{title}</CardTitle> : <div />}
          {actions}
        </CardHeader>
      ) : null}
      <CardContent className="p-0">
        <Table>{children}</Table>
      </CardContent>
    </Card>
  );
}

export function EmptyTableRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return <TableEmptyRow colSpan={colSpan}>{children}</TableEmptyRow>;
}

export function EntityLinkCell({
  href,
  title,
  description,
  cellLabel
}: {
  href: string;
  title: ReactNode;
  description?: ReactNode;
  cellLabel?: string;
}) {
  return (
    <TableCell label={cellLabel}>
      <Link href={href} className="font-medium hover:underline">
        {title}
      </Link>
      {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
    </TableCell>
  );
}

export function MutedCell({ children, cellLabel }: { children: ReactNode; cellLabel?: string }) {
  return <TableCell label={cellLabel} className="text-muted-foreground">{children}</TableCell>;
}

export function TextCell({ children, className, cellLabel }: { children: ReactNode; className?: string; cellLabel?: string }) {
  return <TableCell label={cellLabel} className={className}>{children}</TableCell>;
}

export function FallbackCell({
  value,
  emptyText = "Нет данных",
  cellLabel
}: {
  value?: ReactNode | null;
  emptyText?: ReactNode;
  cellLabel?: string;
}) {
  return <TableCell label={cellLabel}>{value || emptyText}</TableCell>;
}

export function PersonCell({ name, emptyText = "Не выбран", cellLabel }: { name?: string | null; emptyText?: string; cellLabel?: string }) {
  return <FallbackCell value={name} emptyText={emptyText} cellLabel={cellLabel} />;
}

export function TextLinkCell({
  href,
  children,
  muted,
  cellLabel
}: {
  href: string;
  children: ReactNode;
  muted?: boolean;
  cellLabel?: string;
}) {
  return (
    <TableCell label={cellLabel} className={muted ? "text-muted-foreground" : undefined}>
      <Link href={href} className="hover:underline">
        {children}
      </Link>
    </TableCell>
  );
}

export function BadgeCell({
  children,
  label,
  variant = "outline",
  cellLabel
}: {
  children?: ReactNode;
  label?: ReactNode;
  variant?: BadgeProps["variant"];
  cellLabel?: string;
}) {
  return (
    <TableCell label={cellLabel}>
      <Badge variant={variant}>{label ?? children}</Badge>
    </TableCell>
  );
}

export function CountCell({ value, cellLabel }: { value: number; cellLabel?: string }) {
  return <TableCell label={cellLabel} className="tabular-nums">{value}</TableCell>;
}

export function VersionCell({ value, cellLabel }: { value: number; cellLabel?: string }) {
  return <TableCell label={cellLabel} className="tabular-nums">v{value}</TableCell>;
}

export function BooleanCell({
  value,
  trueText = "Да",
  falseText = "Нет",
  cellLabel
}: {
  value: boolean;
  trueText?: string;
  falseText?: string;
  cellLabel?: string;
}) {
  return <TableCell label={cellLabel}>{value ? trueText : falseText}</TableCell>;
}

export function FileLinkCell({ href, cellLabel }: { href?: string | null; cellLabel?: string }) {
  return (
    <TableCell label={cellLabel}>
      {href ? <Link className="hover:underline" href={href}>Скачать</Link> : "Нет файла"}
    </TableCell>
  );
}

export function DateCell({
  children,
  muted,
  warning,
  cellLabel
}: {
  children: ReactNode;
  muted?: ReactNode;
  warning?: boolean;
  cellLabel?: string;
}) {
  return (
    <TableCell label={cellLabel}>
      <div className={cn(warning ? "text-warning" : undefined)}>{children}</div>
      {muted ? <div className="text-xs text-muted-foreground">{muted}</div> : null}
    </TableCell>
  );
}

export function MoneyCell({
  value,
  emptyText = "Без суммы",
  cellLabel
}: {
  value?: number | null;
  emptyText?: string;
  cellLabel?: string;
}) {
  return <TableCell label={cellLabel}>{formatMoney(value, emptyText)}</TableCell>;
}
