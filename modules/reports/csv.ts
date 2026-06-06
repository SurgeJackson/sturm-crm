export function rowsToCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const raw = value == null ? "" : String(value);
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}
