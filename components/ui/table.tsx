import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="responsive-table w-full max-w-full overflow-x-visible">
      <table ref={ref} className={cn("w-full table-fixed caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  empty?: boolean;
};

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, empty, ...props }, ref) => (
    <tr
      ref={ref}
      data-empty={empty ? "true" : undefined}
      className={cn("border-b transition-colors hover:bg-muted/50", className)}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 min-w-0 whitespace-normal break-words px-3 py-3 text-left align-middle font-medium leading-tight text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  label?: string;
  actions?: boolean;
};

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, label, actions, ...props }, ref) => (
    <td
      ref={ref}
      data-label={label}
      data-actions={actions ? "true" : undefined}
      className={cn("min-w-0 whitespace-normal break-words px-3 py-3 align-middle leading-snug", className)}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

function TableEmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <TableRow empty>
      <TableCell colSpan={colSpan} className="h-28 text-center text-sm text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyRow };
