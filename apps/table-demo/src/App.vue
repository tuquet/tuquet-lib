<script setup lang="ts">
import {
  DataTable,
  createActionsColumn,
  createBadgeColumn,
  createCopyableColumn,
  createCurrencyColumn,
  createDateColumn,
  createSelectionColumn,
  exportToCsv,
  copyToClipboardAsTsv,
  useRemoteTable,
  type ColumnDef,
} from '@tuquet/vue-table';
import { Button } from '@tuquet/ui';
import { Download, Plus, RefreshCw, Trash2, CheckCircle, Copy } from 'lucide-vue-next';
import { ref } from 'vue';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  status: 'completed' | 'pending' | 'cancelled';
  total: number;
  createdAt: string;
}

// Mock database
const mockDatabase: Order[] = Array.from({ length: 65 }, (_, i) => {
  const statuses: Order['status'][] = ['completed', 'pending', 'cancelled'];
  const names = [
    'Sarah Connor',
    'John Wick',
    'Tony Stark',
    'Bruce Wayne',
    'Peter Parker',
    'Natasha Romanoff',
    'Clark Kent',
    'Diana Prince',
    'Wanda Maximoff',
    'Steve Rogers',
  ];
  const name = names[i % names.length];
  const daysAgo = (i * 3) % 30;
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    id: `ord_${1000 + i}`,
    orderNumber: `ORD-${202600 + i}`,
    customer: `${name} ${i > 9 ? `(${i + 1})` : ''}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    status: statuses[i % statuses.length],
    total: Math.round((45.5 + i * 18.25) * 100) / 100,
    createdAt: date.toISOString(),
  };
});

const copiedFeedback = ref(false);

const columns: ColumnDef<Order>[] = [
  createSelectionColumn<Order>(),
  createCopyableColumn<Order>({
    accessorKey: 'orderNumber',
    header: 'Order #',
  }),
  {
    accessorKey: 'customer',
    header: 'Customer',
    enableSorting: true,
  },
  createBadgeColumn<Order, Order['status']>({
    accessorKey: 'status',
    header: 'Status',
    variants: {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
    },
  }),
  createCurrencyColumn<Order>({
    accessorKey: 'total',
    header: 'Total',
    currency: 'USD',
  }),
  createDateColumn<Order>({
    accessorKey: 'createdAt',
    header: 'Created',
    relative: true,
  }),
  createActionsColumn<Order>({
    actions: [
      {
        id: 'complete',
        label: 'Mark Completed',
        onSelect: (row) => {
          remote.mutateRow(row.original.id, { status: 'completed' });
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        variant: 'destructive',
        separator: true,
        onSelect: (row) => {
          remote.deleteRow(row.original.id);
        },
      },
    ],
  }),
];

const remote = useRemoteTable<Order>({
  columns,
  defaultPageSize: 10,
  syncWithUrl: false,
  filters: [
    {
      id: 'status',
      title: 'Status',
      type: 'faceted',
      options: [
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ],
  fetcher: async ({ page, limit, sort, search, filters }) => {
    // Simulate server response delay
    await new Promise((r) => setTimeout(r, 200));

    let filtered = [...mockDatabase];

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customer.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      const statusSet = new Set(filters.status);
      filtered = filtered.filter((o) => statusSet.has(o.status));
    }

    // Sort
    if (sort) {
      const isDesc = sort.startsWith('-');
      const field = isDesc ? sort.substring(1) : sort;
      filtered.sort((a, b) => {
        const valA = (a as any)[field];
        const valB = (b as any)[field];
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return { data, total };
  },
});

function handleAddNewOrder() {
  const newId = `ord_${Date.now().toString().slice(-4)}`;
  const newOrder: Order = {
    id: newId,
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
    customer: 'New VIP Customer',
    email: 'vip@example.com',
    status: 'pending',
    total: 299.99,
    createdAt: new Date().toISOString(),
  };

  // Optimistic local prepend
  remote.prependRow(newOrder);
}

function handleExportCsv() {
  exportToCsv({
    data: remote.data.value,
    columns,
    filename: 'showcase-orders.csv',
  });
}

async function handleCopyTsv() {
  const success = await copyToClipboardAsTsv({
    data: remote.selectedRows.value.length > 0 ? remote.selectedRows.value : remote.data.value,
    columns,
  });

  if (success) {
    copiedFeedback.value = true;
    setTimeout(() => {
      copiedFeedback.value = false;
    }, 2000);
  }
}

function handleBulkComplete() {
  const ids = remote.selectedRows.value.map((r) => r.original.id);
  for (const id of ids) {
    remote.mutateRow(id, { status: 'completed' });
  }
  remote.clearSelection();
}

function handleBulkDelete() {
  const ids = remote.selectedRows.value.map((r) => r.original.id);
  remote.deleteRow(ids);
  remote.clearSelection();
}
</script>

<template>
  <main class="min-h-screen bg-background p-6 md:p-10 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Orders Management</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Demonstrating remote pagination, filtering, sorting, optimistic mutations, and export.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="handleExportCsv">
          <Download class="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" @click="handleCopyTsv">
          <Copy class="mr-2 h-4 w-4" />
          {{ copiedFeedback ? 'Copied TSV!' : 'Copy TSV' }}
        </Button>
        <Button size="sm" @click="handleAddNewOrder">
          <Plus class="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>
    </header>

    <!-- Data Table -->
    <DataTable :remote="remote">
      <!-- Bulk Actions in Floating Bar -->
      <template #bulk-actions="{ selectedCount }">
        <Button variant="outline" size="sm" class="h-7 text-xs" @click="handleBulkComplete">
          <CheckCircle class="mr-1.5 h-3.5 w-3.5 text-green-500" />
          Mark Completed ({{ selectedCount }})
        </Button>
        <Button variant="destructive" size="sm" class="h-7 text-xs" @click="handleBulkDelete">
          <Trash2 class="mr-1.5 h-3.5 w-3.5" />
          Delete ({{ selectedCount }})
        </Button>
      </template>
    </DataTable>
  </main>
</template>
