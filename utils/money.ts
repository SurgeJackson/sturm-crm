export function formatMoney(value?: number | null, emptyText = "Без суммы") {
  return value != null ? `${value.toLocaleString("ru-RU")} ₽` : emptyText;
}
