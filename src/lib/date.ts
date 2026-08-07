const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getTodayLocalDateInputValue(): string {
  return toLocalDateInputValue(new Date());
}

export function parseDateOnlyString(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(DATE_ONLY_RE);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toLocalDateOnlyString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toLocalDateInputValue(value);
  }

  if (typeof value === "string") {
    const parsed = parseDateOnlyString(value);
    return parsed ? toLocalDateInputValue(parsed) : null;
  }

  return null;
}

export function formatDateOnlyForDisplay(value: string, locale?: string): string {
  const parsed = parseDateOnlyString(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(locale);
}
