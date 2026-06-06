import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BorderedListItem({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-md border p-3 text-sm", className)}>{children}</div>;
}

export function BorderedListLink({
  href,
  children,
  className
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("block rounded-md border p-3 text-sm", className)}>
      {children}
    </Link>
  );
}
