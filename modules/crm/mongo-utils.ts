import { ObjectId } from "mongodb";

export function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Некорректный идентификатор записи");
  }

  return new ObjectId(id);
}

export function optionalObjectId(id?: string | null) {
  if (!id) return null;
  return toObjectId(id);
}

export function compactString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue.length > 0 ? stringValue : undefined;
}

export function optionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toAuditValue(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (currentValue instanceof ObjectId) {
        return currentValue.toString();
      }

      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }

      return currentValue;
    })
  );
}
