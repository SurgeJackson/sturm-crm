import type { ReactNode } from "react";
import { BorderedListItem } from "@/components/ui/bordered-list-item";
import { cn } from "@/lib/utils";

export function PipelineItemCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <BorderedListItem className={cn("bg-background p-2.5", className)}>{children}</BorderedListItem>;
}
