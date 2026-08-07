const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MDY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
const YMD_SLASH_RE = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
const USER_TIMEZONE_KEY = "mft:user-timezone";

export const DEVICE_TIMEZONE_VALUE = "device";

function getWindow() {
  return typeof window === "undefined" ? null : window;
}

function safeCreateDate(year: number, month: number, day: number): Date | null {
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }
  return parsed;
}

function getDateOnlyPartsForTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value || "0");
  const month = Number(parts.find((part) => part.type === "month")?.value || "0");
  const day = Number(parts.find((part) => part.type === "day")?.value || "0");

  return { year, month, day };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getUserTimeZonePreference(): string {
  const win = getWindow();
  if (!win) return DEVICE_TIMEZONE_VALUE;

  const raw = win.localStorage.getItem(USER_TIMEZONE_KEY);
  if (!raw || raw === DEVICE_TIMEZONE_VALUE) return DEVICE_TIMEZONE_VALUE;
  return isValidTimeZone(raw) ? raw : DEVICE_TIMEZONE_VALUE;
}

export function getUserTimeZone(): string {
  const preference = getUserTimeZonePreference();
  return preference === DEVICE_TIMEZONE_VALUE ? getDeviceTimeZone() : preference;
}

export function setUserTimeZonePreference(preference: string): void {
  const win = getWindow();
  if (!win) return;

  if (!preference || preference === DEVICE_TIMEZONE_VALUE) {
    win.localStorage.setItem(USER_TIMEZONE_KEY, DEVICE_TIMEZONE_VALUE);
    return;
  }

  if (!isValidTimeZone(preference)) {
    throw new Error("Invalid timezone");
  }

  win.localStorage.setItem(USER_TIMEZONE_KEY, preference);
}

export function getSupportedTimeZones(): string[] {
  const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supportedValuesOf === "function") {
    return supportedValuesOf("timeZone");
  }

  return [getDeviceTimeZone(), "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"];
}

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
    return safeCreateDate(year, month, day);
  }

  const mdyMatch = trimmed.match(MDY_RE);
  if (mdyMatch) {
    const month = Number(mdyMatch[1]);
    const day = Number(mdyMatch[2]);
    const shortYear = Number(mdyMatch[3]);
    const year = shortYear < 100 ? 2000 + shortYear : shortYear;
    return safeCreateDate(year, month, day);
  }

  const ymdSlashMatch = trimmed.match(YMD_SLASH_RE);
  if (ymdSlashMatch) {
    const year = Number(ymdSlashMatch[1]);
    const month = Number(ymdSlashMatch[2]);
    const day = Number(ymdSlashMatch[3]);
    return safeCreateDate(year, month, day);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const { year, month, day } = getDateOnlyPartsForTimeZone(parsed, getUserTimeZone());
  return safeCreateDate(year, month, day);
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

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    const { year, month, day } = getDateOnlyPartsForTimeZone(parsed, getUserTimeZone());
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

export function formatDateOnlyForDisplay(value: string, locale?: string): string {
  const parsed = parseDateOnlyString(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(locale);
}

export function formatDateTimeForDisplay(value: string | Date, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(locale, {
    timeZone: getUserTimeZone(),
    ...options,
  });
}
