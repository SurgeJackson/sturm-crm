import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function filterShortcutHref(basePath: string, params: object, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value !== undefined && value !== "") next.set(key, String(value));
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function FilterBar({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <form className={cn("grid gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]", className)}>
          {children}
        </form>
      </CardContent>
    </Card>
  );
}

export function FilterActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-2 md:col-span-full", className)}>{children}</div>;
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
    <NativeSelect name={name} defaultValue={defaultValue ?? ""} aria-label={placeholder} className={className}>
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
    <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      {children}
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
        <Button key={shortcut.label} asChild variant="outline">
          <Link href={filterShortcutHref(basePath, params, shortcut.patch)}>{shortcut.label}</Link>
        </Button>
      ))}
    </>
  );
}
