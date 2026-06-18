export function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export function recordValueOrEmpty(value: unknown): Record<string, unknown> {
  return recordValue(value) ?? {}
}

export function recordsFromValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(recordValue(item)))
    : []
}

export function arrayValue<T>(value: T[] | readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : []
}

export function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function trimmedTextValue(value: unknown) {
  return textValue(value).trim()
}

export function normalizeTextKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function stringListFromValue(value: unknown) {
  return Array.isArray(value) ? value.map(trimmedTextValue).filter(Boolean) : []
}

export function numberFromValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
