export function enumParam<T extends string>(value: string | undefined, allowed: Record<T, unknown>): T | undefined {
  if (!value) return undefined;
  return Object.prototype.hasOwnProperty.call(allowed, value) ? (value as T) : undefined;
}

export function upperEnumParam<T extends string>(value: string | undefined, allowed: Record<T, unknown>): T | undefined {
  return enumParam(value?.toUpperCase(), allowed);
}

export function flagParam(value: string | undefined) {
  return value === "1";
}
