import type { ColumnDef, Row } from '@tanstack/vue-table';
import { Badge } from '@tuquet/ui';
import { h } from 'vue';
import CopyableCell from '../components/CopyableCell.vue';
import DataTableRowActions, { type RowActionItem } from '../components/DataTableRowActions.vue';

// --- Date Column ---
export interface DateColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  locale?: string;
  relative?: boolean;
  dateFormatOptions?: Intl.DateTimeFormatOptions;
  nullValue?: string;
  enableSorting?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffSec = Math.round((now - date.getTime()) / 1000);

  if (diffSec < 45) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function createDateColumn<TData>(options: DateColumnOptions<TData>): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    locale = 'en-US',
    relative = false,
    dateFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    nullValue = '-',
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const raw = getValue();
      if (!raw) return nullValue;

      const date = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(date.getTime())) return String(raw);

      if (relative) {
        return h(
          'span',
          { title: date.toLocaleString(locale, dateFormatOptions) },
          formatRelativeTime(date)
        );
      }

      return date.toLocaleString(locale, dateFormatOptions);
    },
    enableSorting,
  };
}

// --- Badge Column ---
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeColumnOptions<TData, TValue extends string = string> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  variants: Partial<Record<TValue, BadgeVariant>>;
  labels?: Partial<Record<TValue, string>>;
  defaultVariant?: BadgeVariant;
  nullValue?: string;
  enableSorting?: boolean;
}

export function createBadgeColumn<TData, TValue extends string = string>(
  options: BadgeColumnOptions<TData, TValue>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    variants,
    labels = {} as Partial<Record<TValue, string>>,
    defaultVariant = 'outline',
    nullValue = '-',
    enableSorting = true,
  } = options;

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const val = getValue() as TValue;
      if (val === undefined || val === null) return nullValue;

      const variant = variants[val] ?? defaultVariant;
      const label = labels[val] ?? String(val);

      return h(
        Badge,
        {
          variant,
          class: 'capitalize font-normal',
        },
        () => label
      );
    },
    enableSorting,
  };
}

// --- Currency Column ---
export interface CurrencyColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  currency?: string;
  locale?: string;
  nullValue?: string;
  enableSorting?: boolean;
}

export function createCurrencyColumn<TData>(
  options: CurrencyColumnOptions<TData>
): ColumnDef<TData, any> {
  const {
    accessorKey,
    header,
    id = accessorKey,
    currency = 'USD',
    locale = 'en-US',
    nullValue = '-',
    enableSorting = true,
  } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const val = getValue();
      if (val === undefined || val === null) return nullValue;

      const num = typeof val === 'number' ? val : Number(val);
      if (Number.isNaN(num)) return String(val);

      return formatter.format(num);
    },
    enableSorting,
  };
}

// --- Copyable Column ---
export interface CopyableColumnOptions<TData> {
  accessorKey: keyof TData & string;
  header: string;
  id?: string;
  truncateLength?: number;
  enableSorting?: boolean;
}

export function createCopyableColumn<TData>(
  options: CopyableColumnOptions<TData>
): ColumnDef<TData, any> {
  const { accessorKey, header, id = accessorKey, truncateLength, enableSorting = true } = options;

  return {
    id,
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const val = getValue();
      if (val === undefined || val === null) return '-';

      return h(CopyableCell, {
        value: String(val),
        truncateLength,
      });
    },
    enableSorting,
  };
}

// --- Actions Column ---
export interface ActionsColumnOptions<TData> {
  id?: string;
  header?: string;
  actions: RowActionItem<TData>[];
  size?: number;
}

export function createActionsColumn<TData>(
  options: ActionsColumnOptions<TData>
): ColumnDef<TData, any> {
  const { id = 'actions', header = '', actions, size = 50 } = options;

  return {
    id,
    header,
    cell: ({ row }: { row: Row<TData> }) => {
      return h(DataTableRowActions, {
        row,
        actions,
      });
    },
    enableSorting: false,
    enableHiding: false,
    size,
  };
}
