"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({
  label = "Печать",
  size = "sm"
}: {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <Button type="button" variant="outline" size={size} onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
