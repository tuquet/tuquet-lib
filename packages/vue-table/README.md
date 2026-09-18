# @tuquet/vue-table

Enterprise, remote-driven Data Table system for **Vue 3**, powered by **TanStack Table** and **Shadcn-Vue** ([`@tuquet/ui`](../ui)).

## ✨ Features

- **Headless + UI Complete**: Seamless bridge between headless TanStack Table logic and polished Shadcn-Vue UI components.
- **Server-side Orchestration**: Remote filtering, remote sorting, remote pagination, and debounced search with automatic request cancellation via `AbortController`.
- **Bi-directional URL Sync**: Two-way synchronization between table state (pagination, sorting, filters, search) and browser URL query strings for deep linking and shareable URLs.
- **Pluggable Query Adapters**: Comes out-of-the-box with `StandardRestAdapter` (standard REST `?page=1&limit=20&sort=-createdAt&status=active,pending&q=keyword`) and `LhsBracketsAdapter` (NestJS/Strapi `filter[status][in]=...`), or customize your own in 1 line.
- **Declarative Faceted Filters**: Multi-select category filters with search inside options, badges, and counts built on Radix Popover and Command.
- **Zero-Boilerplate DX**: Connect any backend endpoint to a fully functional table with search, filter, sort, pagination, skeletons, and empty state in under 30 lines of code.

## 📦 Installation

```bash
pnpm add @tuquet/vue-table @tuquet/ui @tanstack/vue-table
```

Ensure global styles are imported in your app entry (`main.ts`):

```ts
import '@tuquet/ui/style.css';
```

## 🚀 Quickstart Example

```vue
<script setup lang="ts">
import { h } from 'vue';
import { DataTable, useRemoteTable, type ColumnDef } from '@tuquet/vue-table';
import { Badge } from '@tuquet/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Full Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.status === 'active' ? 'default' : 'secondary' },
        () => row.original.status
      ),
  },
];

const remote = useRemoteTable<User>({
  columns,
  fetcher: async ({ toQueryString }) => {
    const res = await fetch(`/api/users?${toQueryString()}`);
    return res.json(); // returns { data: User[], total: number }
  },
  defaultPageSize: 10,
  syncWithUrl: true,
  filters: [
    {
      id: 'status',
      title: 'Status',
      type: 'faceted',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
  ],
});
</script>

<template>
  <div class="p-6">
    <DataTable :remote="remote" />
  </div>
</template>
```

## 📚 Components Included

| Component                      | Description                                                                                                               |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **`<DataTable>`**              | Container component orchestrating toolbar, header, body with loading skeletons, empty state, error retry, and pagination. |
| **`<DataTableToolbar>`**       | Search input, dynamic faceted filter triggers, reset button, and custom action slots (`#actions`).                        |
| **`<DataTableFloatingBar>`**   | Floating bulk action bar animated at bottom with selection count badge, `#actions` slot, and `Clear` (Esc) trigger.       |
| **`<DataTableRowActions>`**    | Dropdown action menu (3 dots) with custom actions, icons, separators, and destructive variants.                           |
| **`<DataTablePagination>`**    | Page navigation (first, prev, next, last), rows per page selector (10/20/50/100), selection summary.                      |
| **`<DataTableColumnHeader>`**  | Sortable column header button with Asc / Desc / Clear icons and hide column menu.                                         |
| **`<DataTableFacetedFilter>`** | Multi-select category popover with command search, item checkboxes, and count badges.                                     |
| **`<DataTableViewOptions>`**   | Dropdown menu to toggle column visibility.                                                                                |
| **`<CopyableCell>`**           | Inline cell rendering with click-to-copy button and checkmark confirmation.                                               |

## 🔘 Row Selection & Bulk Actions

Easily add row selection with `createSelectionColumn()` and bulk action toolbar:

```ts
import { createSelectionColumn, type ColumnDef } from '@tuquet/vue-table';

const columns: ColumnDef<User>[] = [
  createSelectionColumn<User>({
    isRowSelectable: (row) => row.original.status !== 'suspended', // optional guard
  }),
  { accessorKey: 'name', header: 'Name' },
  // ...
];
```

In your template, pass bulk action buttons into the `#bulk-actions` slot:

```vue
<DataTable :remote="remote">
  <template #bulk-actions="{ selectedRows, selectedCount }">
    <Button variant="destructive" size="sm" @click="handleBulkDelete(selectedRows)">
      Delete ({{ selectedCount }})
    </Button>
  </template>
</DataTable>
```

## 🎨 Pre-built Column Formatters

Build clean, consistent table columns in seconds with typed helpers:

```ts
import {
  createSelectionColumn,
  createDateColumn,
  createBadgeColumn,
  createCurrencyColumn,
  createCopyableColumn,
  createActionsColumn,
  type ColumnDef,
} from '@tuquet/vue-table';

const columns: ColumnDef<Order>[] = [
  createSelectionColumn(),
  createCopyableColumn({ accessorKey: 'orderNumber', header: 'Order #' }),
  createCurrencyColumn({ accessorKey: 'total', header: 'Total', currency: 'USD' }),
  createBadgeColumn({
    accessorKey: 'status',
    header: 'Status',
    variants: {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    },
  }),
  createDateColumn({
    accessorKey: 'createdAt',
    header: 'Ordered At',
    relative: true, // "5m ago", "yesterday", etc.
  }),
  createActionsColumn({
    actions: [
      { id: 'view', label: 'View Details', onSelect: (row) => viewOrder(row.original) },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        separator: true,
        onSelect: (row) => remote.deleteRow(row.original.id),
      },
    ],
  }),
];
```

## 🔄 Optimistic CRUD Local Mutations

Pair `@tuquet/vue-table` with `@tuquet/vue-form` or any modal/sheet for instant UI updates without slow network refetches:

```ts
// Update a record in-place after modal edit
remote.mutateRow(orderId, { status: 'completed' });

// Delete row(s) and automatically decrement total
remote.deleteRow(orderId);
remote.deleteRow([orderId1, orderId2]); // bulk delete

// Prepend newly created item from drawer to top
remote.prependRow(newOrder);

// Force refresh from server when needed
await remote.refetch();
```

## 📤 CSV & TSV Data Export

Export table data with automatic Excel UTF-8 BOM encoding:

```ts
import { exportToCsv, copyToClipboardAsTsv } from '@tuquet/vue-table';

// Download current page or filtered records
exportToCsv({
  data: remote.data.value,
  columns,
  filename: 'orders-export.csv',
});

// Or copy selected rows for pasting into Google Sheets / Excel
await copyToClipboardAsTsv({
  data: remote.selectedRows.value,
  columns,
});
```

## 🔌 Query Adapters

### 1. `StandardRestAdapter` (Default)

Generates query string:

```
?page=1&limit=10&sort=-createdAt,name&status=active,pending&q=keyword
```

### 2. `LhsBracketsAdapter`

Generates query string:

```
?page=1&limit=10&sort[createdAt]=desc&filter[status][in]=active,pending&filter[q]=keyword
```

### Custom Adapter

Implement the `QueryAdapter` interface:

```ts
const myAdapter: QueryAdapter = {
  name: 'my-custom',
  serialize: (state) => ({ ... }),
  deserialize: (query) => ({ ... }),
};
```

## 📄 License

MIT © Tuquet
