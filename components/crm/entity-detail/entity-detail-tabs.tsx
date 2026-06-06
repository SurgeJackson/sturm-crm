import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type EntityDetailTab = {
  value: string;
  label: ReactNode;
  content: ReactNode;
};

export function EntityDetailTabs({
  tabs,
  defaultValue = tabs[0]?.value
}: {
  tabs: EntityDetailTab[];
  defaultValue?: string;
}) {
  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList className="flex-wrap">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
