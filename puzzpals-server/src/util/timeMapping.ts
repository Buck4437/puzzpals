// Utility for mapping date-only strings to full timestamp strings for SQL queries
// Ensures date_start and date_end cover the full day if only a date is provided

/**
 * Given a date string, returns a timestamp string for SQL queries.
 * - For start: 'YYYY-MM-DD' => 'YYYY-MM-DD 00:00:00'
 * - For end:   'YYYY-MM-DD' => 'YYYY-MM-DD 23:59:59.999'
 * If input is already a datetime, returns as is.
 */
export function mapDateForSql(date: string, type: "start" | "end"): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return type === "start" ? date + " 00:00:00" : date + " 23:59:59.999";
  }
  return date;
}
