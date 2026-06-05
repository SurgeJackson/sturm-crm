import { CheckSquare } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function TasksPage() {
  return (
    <PlaceholderPage
      title="Задачи / касания"
      description="Планирование звонков, встреч и проектных действий."
      icon={CheckSquare}
      actionLabel="Создать задачу"
    />
  );
}
