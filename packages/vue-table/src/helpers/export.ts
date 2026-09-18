import type { ColumnDef, Row } from '@tanstack/vue-table';

export interface ExportColumn<TData> {
  id: string;
  header: string;
  accessor?: (row: TData) => unknown;
}

export interface ExportCsvOptions<TData> {
  data: (TData | Row<TData>)[];
  filename?: string;
  columns?: (ColumnDef<TData, any> | ExportColumn<TData>)[];
  includeBOM?: boolean;
}

export interface CopyTsvOptions<TData> {
  data: (TData | Row<TData>)[];
  columns?: (ColumnDef<TData, any> | ExportColumn<TData>)[];
}

function extractRawRows<TData>(rows: (TData | Row<TData>)[]): TData[] {
  return rows.map((r) => {
    if (r && typeof r === 'object' && 'original' in r) {
      return (r as Row<TData>).original;
    }
    return r as TData;
  });
}

function resolveColumns<TData>(
  data: TData[],
  columns?: (ColumnDef<TData, any> | ExportColumn<TData>)[]
): { id: string; header: string; getValue: (row: TData) => unknown }[] {
  if (columns && columns.length > 0) {
    return columns
      .filter((col) => {
        const id = (col as any).id ?? (col as any).accessorKey;
        return id !== 'select' && id !== 'actions';
      })
      .map((col) => {
        const id = String((col as any).id ?? (col as any).accessorKey ?? '');
        const header = typeof (col as any).header === 'string' ? (col as any).header : id;
        const getValue = (row: TData) => {
          if (typeof (col as any).accessor === 'function') {
            return (col as any).accessor(row);
          }
          if ((col as any).accessorKey) {
            return (row as any)[(col as any).accessorKey];
          }
          return (row as any)[id];
        };
        return { id, header, getValue };
      });
  }

  if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    return Object.keys(data[0]).map((key) => ({
      id: key,
      header: key,
      getValue: (row: TData) => (row as any)[key],
    }));
  }

  return [];
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeTsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

/**
 * Generate CSV string from table records
 */
export function generateCsv<TData>(options: Omit<ExportCsvOptions<TData>, 'filename'>): string {
  const rawRows = extractRawRows(options.data);
  const cols = resolveColumns(rawRows, options.columns);

  if (cols.length === 0) return '';

  const headerLine = cols.map((c) => escapeCsvCell(c.header)).join(',');
  const rowLines = rawRows.map((row) => {
    return cols.map((c) => escapeCsvCell(c.getValue(row))).join(',');
  });

  const content = [headerLine, ...rowLines].join('\r\n');
  const bom = options.includeBOM !== false ? '\uFEFF' : '';
  return bom + content;
}

/**
 * Download CSV file in browser
 */
export function exportToCsv<TData>(options: ExportCsvOptions<TData>): void {
  if (typeof window === 'undefined') return;

  const { filename = 'table-export.csv' } = options;
  const csvContent = generateCsv(options);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate TSV (Tab-Separated Values) string and copy to clipboard
 */
export async function copyToClipboardAsTsv<TData>(
  options: CopyTsvOptions<TData>
): Promise<boolean> {
  const rawRows = extractRawRows(options.data);
  const cols = resolveColumns(rawRows, options.columns);

  if (cols.length === 0) return false;

  const headerLine = cols.map((c) => escapeTsvCell(c.header)).join('\t');
  const rowLines = rawRows.map((row) => {
    return cols.map((c) => escapeTsvCell(c.getValue(row))).join('\t');
  });

  const tsv = [headerLine, ...rowLines].join('\n');

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy TSV to clipboard:', err);
    return false;
  }
}
