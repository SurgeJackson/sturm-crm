import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";

type DetailField = {
  label: string;
  value?: ReactNode | null;
};

export function detailText(label: string, value?: ReactNode | null): DetailField {
  return { label, value };
}

export function detailDate(label: string, value?: Date | string | null): DetailField {
  return { label, value: formatRussianDate(value) };
}

export function detailMoney(label: string, value?: number | null, emptyText?: string): DetailField {
  return { label, value: formatMoney(value, emptyText) };
}

function Detail({ label, value }: { label: string; value?: ReactNode | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</dl>;
}

export function EntityDetailsCard({
  title,
  fields,
  footer
}: {
  title: string;
  fields: DetailField[];
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <DetailGrid>
          {fields.map((field) => (
            <Detail key={field.label} label={field.label} value={field.value} />
          ))}
        </DetailGrid>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
