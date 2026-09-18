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
| **`<DataTablePagination>`**    | Page navigation (first, prev, next, last), rows per page selector (10/20/50/100), selection summary.                      |
| **`<DataTableColumnHeader>`**  | Sortable column header button with Asc / Desc / Clear icons and hide column menu.                                         |
| **`<DataTableFacetedFilter>`** | Multi-select category popover with command search, item checkboxes, and count badges.                                     |
| **`<DataTableViewOptions>`**   | Dropdown menu to toggle column visibility.                                                                                |

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
