/** Parses a "YYYY-MM-DD" string into a UTC-midnight Date, matching Prisma's @db.Date columns. */
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Formats a Date (or date-only string) back to "YYYY-MM-DD" in UTC. */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}
