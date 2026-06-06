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
  description
}: {
  href: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <TableCell>
      <Link href={href} className="font-medium hover:underline">
        {title}
      </Link>
      {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
    </TableCell>
  );
}

export function MutedCell({ children }: { children: ReactNode }) {
  return <TableCell className="text-muted-foreground">{children}</TableCell>;
}

export function TextLinkCell({
  href,
  children,
  muted
}: {
  href: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <TableCell className={muted ? "text-muted-foreground" : undefined}>
      <Link href={href} className="hover:underline">
        {children}
      </Link>
    </TableCell>
  );
}

export function BadgeCell({
  children,
  label,
  variant = "outline"
}: {
  children?: ReactNode;
  label?: ReactNode;
  variant?: BadgeProps["variant"];
}) {
  return (
    <TableCell>
      <Badge variant={variant}>{label ?? children}</Badge>
    </TableCell>
  );
}

export function CountCell({ value }: { value: number }) {
  return <TableCell className="tabular-nums">{value}</TableCell>;
}

export function VersionCell({ value }: { value: number }) {
  return <TableCell className="tabular-nums">v{value}</TableCell>;
}

export function BooleanCell({
  value,
  trueText = "Да",
  falseText = "Нет"
}: {
  value: boolean;
  trueText?: string;
  falseText?: string;
}) {
  return <TableCell>{value ? trueText : falseText}</TableCell>;
}

export function FileLinkCell({ href }: { href?: string | null }) {
  return (
    <TableCell>
      {href ? <Link className="hover:underline" href={href}>Скачать</Link> : "Нет файла"}
    </TableCell>
  );
}

export function DateCell({
  children,
  muted,
  warning
}: {
  children: ReactNode;
  muted?: ReactNode;
  warning?: boolean;
}) {
  return (
    <TableCell>
      <div className={cn(warning ? "text-warning" : undefined)}>{children}</div>
      {muted ? <div className="text-xs text-muted-foreground">{muted}</div> : null}
    </TableCell>
  );
}

export function MoneyCell({
  value,
  emptyText = "Без суммы"
}: {
  value?: number | null;
  emptyText?: string;
}) {
  return <TableCell>{formatMoney(value, emptyText)}</TableCell>;
}
