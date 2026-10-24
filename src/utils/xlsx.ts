import * as XLSX from 'xlsx';

export type SheetColumn<T> = {
  key: keyof T & string;
  label: string;
  /** Convert a value to a cell string/number for export. Defaults to identity. */
  toCell?: (row: T) => string | number | boolean | null;
  /** Parse a cell value back into the target type for import. Defaults to identity. */
  fromCell?: (raw: unknown, row: Record<string, unknown>) => unknown;
};

/**
 * Export an array of records as an .xlsx download.
 */
export function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  columns: SheetColumn<T>[],
  filename: string,
): void {
  const data = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      const val = col.toCell ? col.toCell(row) : row[col.key];
      out[col.label] = val ?? '';
    }
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Build a template .xlsx with only headers (no data rows) and download it.
 */
export function downloadTemplate<T extends Record<string, unknown>>(
  columns: SheetColumn<T>[],
  filename: string,
  sample?: Partial<Record<keyof T, unknown>>,
): void {
  const headerObj: Record<string, unknown> = {};
  for (const col of columns) headerObj[col.label] = sample?.[col.key] ?? '';
  const ws = XLSX.utils.json_to_sheet([headerObj], {
    header: columns.map((c) => c.label),
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Parse an uploaded .xlsx File into an array of typed records.
 * Uses column labels (Vietnamese headers) to map back to keys.
 */
export async function parseXlsx<T extends Record<string, unknown>>(
  file: File,
  columns: SheetColumn<T>[],
): Promise<T[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const labelToKey = new Map(columns.map((c) => [c.label, c.key]));
  return json.map((rawRow) => {
    const mapped: Record<string, unknown> = {};
    for (const [label, value] of Object.entries(rawRow)) {
      const key = labelToKey.get(label);
      if (!key) continue;
      mapped[key] = value;
    }
    const out = {} as T;
    for (const col of columns) {
      const rawVal = mapped[col.key] ?? '';
      out[col.key] = (col.fromCell ? col.fromCell(rawVal, mapped) : rawVal) as T[typeof col.key];
    }
    return out;
  });
}
