const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });

export type SchedulePlannerDay = {
  date: string;
  day: number;
  weekday: string;
  isWeekend: boolean;
};

export function getMonthDays(year: number, month: number): SchedulePlannerDay[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(Date.UTC(year, month - 1, day));
    const weekdayIndex = date.getUTCDay();
    return {
      date: formatDateKey(year, month, day),
      day,
      weekday: weekdayFormatter.format(date).replace(".", ""),
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6
    };
  });
}

export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
