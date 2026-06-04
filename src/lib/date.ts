// Generic date helpers shared across the app.

export function todayString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBeforeToday(days: number, date = new Date()): string {
  return new Date(date.getTime() - days * 86400000).toISOString().slice(0, 10);
}
