import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

export function CheckboxGroupField({
  name,
  label,
  options,
  selectedValues,
  className
}: {
  name: string;
  label: ReactNode;
  options: SelectOption[];
  selectedValues: Set<string>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selectedValues.has(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
