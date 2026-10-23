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

/**
 * Formats a Date to YYYY-MM-DDTHH:mm using LOCAL timezone components.
 * Used for lock deadlines — avoids UTC conversion.
 */
export function localDateTimeStr(d: Date = new Date()): string {
  const date = localDateStr(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${date}T${hh}:${mi}`;
}

/**
 * Formats a YYYY-MM-DD string to DD/MM/YYYY for display.
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats a YYYY-MM-DDTHH:mm string to DD/MM HH:mm for display.
 */
export function formatDateTimeDisplay(dtStr: string): string {
  if (!dtStr) return '—';
  const [datePart, timePart] = dtStr.split('T');
  if (!datePart) return dtStr;
  const parts = datePart.split('-');
  if (parts.length !== 3) return dtStr;
  const time = timePart ? ` ${timePart}` : '';
  return `${parts[2]}/${parts[1]}${time}`;
}

/**
 * Calculates overtime hours for a given shift duration.
 * Any worked time beyond the threshold (default 10 hours) is flagged as overtime.
 */
export function calculateOvertimeHours(shiftHours: number, threshold = 10): number {
  if (!shiftHours || shiftHours <= 0) return 0;
  const ot = Math.max(0, shiftHours - threshold);
  return Math.round(ot * 100) / 100;
}
