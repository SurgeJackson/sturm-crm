import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function ObjectsPage() {
  return (
    <PlaceholderPage
      title="Объекты"
      description="Проектные объекты, комплектации и ответственные участники."
      icon={Building2}
      actionLabel="Создать объект"
    />
  );
}
