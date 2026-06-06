import type { ReactNode } from "react";

export function Detail({ label, value }: { label: string; value?: ReactNode | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}
