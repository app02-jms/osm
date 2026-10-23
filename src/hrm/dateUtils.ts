/**
 * Formats a Date to YYYY-MM-DD using LOCAL timezone components.
 * Never use toISOString().slice(0,10) — that converts to UTC and
 * shifts dates backwards after 17:00 in UTC+7.
 */
export function localDateStr(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
