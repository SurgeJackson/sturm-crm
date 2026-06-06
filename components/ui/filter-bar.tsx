import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
