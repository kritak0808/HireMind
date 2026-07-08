/**
 * Helper utilities shared across the Next.js and frontend environments
 */

export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

export function formatISODate(date: Date): string {
  return date.toISOString();
}

export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
