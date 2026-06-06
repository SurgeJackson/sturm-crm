import type { ReactNode } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type FilterShortcut = {
  label: string;
  patch: Record<string, string | undefined>;
};

export type ActiveFilter = {
  key: string;
  label: string;
  value: ReactNode;
  href?: string;
};

export function filterShortcutHref(basePath: string, params: object, patch: Record<string, string | undefined | null>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value !== undefined && value !== null && value !== "") next.set(key, String(value));
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function FilterBar({
  children,
  className,
  summary = "Фильтры",
  activeFilters,
  resetHref
}: {
  children: ReactNode;
  className?: string;
  summary?: string;
  activeFilters?: ActiveFilter[];
  resetHref?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <details className="group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium md:hidden">
            <span>{summary}</span>
            <Badge variant="outline" className="shrink-0">{activeFilters?.length ?? 0}</Badge>
          </summary>
          <form className={cn("mt-3 grid gap-2 md:mt-0 md:[grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]", className)}>
            {children}
          </form>
        </details>
        {activeFilters?.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
            {activeFilters?.map((filter) => (
              <Button key={filter.key} asChild={Boolean(filter.href)} variant="outline" size="sm" className="h-7 max-w-full gap-1 px-2 text-xs">
                {filter.href ? (
                  <Link href={filter.href}>
                    <span className="shrink-0 text-muted-foreground">{filter.label}:</span>
                    <span className="min-w-0 truncate">{filter.value}</span>
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                ) : (
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{filter.label}:</span>
                    <span className="ml-1">{filter.value}</span>
                  </span>
                )}
              </Button>
            ))}
            {resetHref ? (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link href={resetHref}>Сбросить все</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function FilterActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 md:col-span-full [&_a]:h-8 [&_a]:px-2.5 [&_a]:text-xs [&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FilterSearchInput({
  name = "q",
  defaultValue,
  placeholder = "Поиск",
  className
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input name={name} placeholder={placeholder} defaultValue={defaultValue ?? ""} className="h-9 pl-9" aria-label={placeholder} />
    </div>
  );
}

export function FilterDateInput({
  name,
  defaultValue,
  label,
  className
}: {
  name: string;
  defaultValue?: string;
  label: string;
  className?: string;
}) {
  return <Input name={name} type="date" defaultValue={defaultValue ?? ""} aria-label={label} className={cn("h-9", className)} />;
}

export function FilterSelect({
  name,
  defaultValue,
  placeholder,
  options,
  children,
  className
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  options?: FilterOption[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <NativeSelect name={name} defaultValue={defaultValue ?? ""} aria-label={placeholder} className={cn("h-9 px-2", className)}>
      <option value="">{placeholder}</option>
      {options?.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
      {children}
    </NativeSelect>
  );
}

export function FilterCheckbox({
  name,
  children,
  value = "1",
  defaultChecked
}: {
  name: string;
  children: ReactNode;
  value?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="grid min-h-9 max-w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-md border px-2.5 py-2 text-sm leading-tight">
      <input className="mt-0.5 shrink-0" type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      <span className="min-w-0 break-words">{children}</span>
    </label>
  );
}

export function FilterShortcutButtons({
  basePath,
  params,
  shortcuts
}: {
  basePath: string;
  params: object;
  shortcuts: FilterShortcut[];
}) {
  return (
    <>
      {shortcuts.map((shortcut) => (
        <Button key={shortcut.label} asChild variant="outline" size="sm">
          <Link href={filterShortcutHref(basePath, params, shortcut.patch)}>{shortcut.label}</Link>
        </Button>
      ))}
    </>
  );
}
