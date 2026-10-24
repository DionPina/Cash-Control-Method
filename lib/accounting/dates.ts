export function todayIso(): string {
  const date = new Date();
  return toIsoDate(date);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, days: number): string {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function startOfWeek(value: string): string {
  const date = fromIsoDate(value);
  const day = date.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - distanceFromMonday);
  return toIsoDate(date);
}

export function endOfWeek(value: string): string {
  return addDays(startOfWeek(value), 6);
}

export function startOfMonth(value: string): string {
  const date = fromIsoDate(`${value.slice(0, 7)}-01`);
  return toIsoDate(date);
}

export function endOfMonth(value: string): string {
  const start = fromIsoDate(startOfMonth(value));
  return toIsoDate(new Date(start.getFullYear(), start.getMonth() + 1, 0));
}

export function shiftMonth(value: string, change: number): string {
  const date = fromIsoDate(startOfMonth(value));
  date.setMonth(date.getMonth() + change);
  return toIsoDate(date);
}

export function formatDate(value: string): string {
  return fromIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonth(value: string): string {
  return fromIsoDate(startOfMonth(value)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate(fromIsoDate(value)) === value;
}
