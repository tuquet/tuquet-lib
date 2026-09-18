import type { ColumnDef, Row, Table } from '@tanstack/vue-table';
import { Checkbox } from '@tuquet/vue-ui';
import { h } from 'vue';

export interface SelectionColumnOptions<TData> {
  id?: string;
  isRowSelectable?: (row: Row<TData>) => boolean;
  headerAriaLabel?: string;
  rowAriaLabel?: (row: Row<TData>) => string;
}

export function createSelectionColumn<TData>(
  options: SelectionColumnOptions<TData> = {}
): ColumnDef<TData, unknown> {
  const {
    id = 'select',
    isRowSelectable,
    headerAriaLabel = 'Select all rows',
    rowAriaLabel = (row) => `Select row ${row.index + 1}`,
  } = options;

  return {
    id,
    header: ({ table }: { table: Table<TData> }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();

      return h(Checkbox, {
        checked: isAllSelected ? true : isSomeSelected ? 'indeterminate' : false,
        'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
        'aria-label': headerAriaLabel,
        class: 'translate-y-[2px]',
      });
    },
    cell: ({ row }: { row: Row<TData> }) => {
      const selectable = isRowSelectable ? isRowSelectable(row) : true;

      return h(Checkbox, {
        checked: row.getIsSelected(),
        disabled: !selectable,
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        'aria-label': rowAriaLabel(row),
        class: 'translate-y-[2px]',
        onClick: (e: MouseEvent) => e.stopPropagation(),
      });
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
