import type { ReactNode } from "react";

export function ReportTablesGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-2">{children}</div>;
}
