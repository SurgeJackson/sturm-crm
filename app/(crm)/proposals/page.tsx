import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function ProposalsPage() {
  return (
    <PlaceholderPage
      title="КП"
      description="Коммерческие предложения и контроль follow-up."
      icon={FileText}
      actionLabel="Создать КП"
    />
  );
}
