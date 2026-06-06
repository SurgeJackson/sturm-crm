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

export function InfoTile({
  label,
  children,
  className
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <BorderedListItem className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1">{children}</div>
    </BorderedListItem>
  );
}

export function InlineNotice({
  children,
  tone = "default",
  className
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "destructive" | "primary";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        tone === "accent" ? "border-accent bg-accent/15" : undefined,
        tone === "destructive" ? "border-destructive text-destructive" : undefined,
        tone === "primary" ? "border-primary text-primary" : undefined,
        className
      )}
    >
      {children}
    </div>
  );
}

export function TimelineListItem({
  title,
  meta,
  className
}: {
  title: ReactNode;
  meta: ReactNode;
  className?: string;
}) {
  return (
    <BorderedListItem className={className}>
      <div className="flex justify-between gap-3">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{meta}</span>
      </div>
    </BorderedListItem>
  );
}
