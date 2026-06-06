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
  return <BorderedListItem className={cn("bg-background", className)}>{children}</BorderedListItem>;
}
