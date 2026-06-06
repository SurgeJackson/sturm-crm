import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableEmptyRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
        <CardHeader className={actions ? "flex flex-row items-center justify-between" : undefined}>
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

export function MoneyCell({ value }: { value?: number | null }) {
  return <TableCell>{value ? `${value.toLocaleString("ru-RU")} ₽` : "Без суммы"}</TableCell>;
}
