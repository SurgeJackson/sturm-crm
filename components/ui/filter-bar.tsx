import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
        <form className={cn("grid gap-3", className)}>{children}</form>
      </CardContent>
    </Card>
  );
}

export function FilterActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}
