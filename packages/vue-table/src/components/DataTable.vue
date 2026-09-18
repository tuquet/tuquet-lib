<script setup lang="ts" generic="TData">
import { FlexRender, type Column } from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tuquet/vue-ui';
import { AlertCircle, RefreshCw } from 'lucide-vue-next';
import { computed, ref, type CSSProperties } from 'vue';
import type { UseRemoteTableReturn } from '../composables/useRemoteTable.js';
import type { TableDensity } from '../types/index.js';
import DataTableFloatingBar from './DataTableFloatingBar.vue';
import DataTablePagination from './DataTablePagination.vue';
import DataTableToolbar from './DataTableToolbar.vue';

export interface DataTableProps<TData> {
  remote: UseRemoteTableReturn<TData>;
  showToolbar?: boolean;
  showPagination?: boolean;
  showFloatingBar?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  density?: TableDensity;
  /**
   * Enable virtual scrolling for large datasets
   */
  virtual?: boolean;
  /**
   * Container height when virtual is enabled (e.g. '500px' or 500)
   */
  virtualHeight?: string | number;
  /**
   * Estimated row height in pixels
   */
  estimatedRowHeight?: number;
  /**
   * Number of items rendered outside the viewport
   */
  overscan?: number;
}

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  showToolbar: true,
  showPagination: true,
  showFloatingBar: true,
  emptyMessage: 'No results found.',
  skeletonRows: 5,
  density: 'normal',
  virtual: false,
  virtualHeight: '500px',
  overscan: 5,
});

const tableContainerRef = ref<HTMLDivElement | null>(null);

const table = computed(() => props.remote.table);
const isLoading = computed(() => props.remote.isLoading.value);
const isError = computed(() => props.remote.isError.value);
const error = computed(() => props.remote.error.value);
const columnCount = computed(() => table.value.getAllColumns().length);
const rows = computed(() => table.value.getRowModel().rows);

const defaultEstimateSize = computed(() => {
  if (props.estimatedRowHeight) return props.estimatedRowHeight;
  switch (props.density) {
    case 'compact':
      return 36;
    case 'comfortable':
      return 56;
    default:
      return 44;
  }
});

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.virtual ? rows.value.length : 0,
    getScrollElement: () => tableContainerRef.value,
    estimateSize: () => defaultEstimateSize.value,
    overscan: props.overscan,
  }))
);

const virtualRows = computed(() => {
  if (!props.virtual) return [];
  return rowVirtualizer.value.getVirtualItems();
});

const totalVirtualSize = computed(() => {
  if (!props.virtual) return 0;
  return rowVirtualizer.value.getTotalSize();
});

const paddingTop = computed(() => {
  if (!props.virtual || virtualRows.value.length === 0) return 0;
  return virtualRows.value[0]?.start ?? 0;
});

const paddingBottom = computed(() => {
  if (!props.virtual || virtualRows.value.length === 0) return 0;
  const lastItem = virtualRows.value[virtualRows.value.length - 1];
  return totalVirtualSize.value - (lastItem?.end ?? 0);
});

const densityClasses = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'py-1.5 px-2.5 text-xs';
    case 'comfortable':
      return 'py-4 px-4 text-sm';
    default:
      return 'py-2.5 px-4 text-sm';
  }
});

function getPinningStyle(column: Column<any>): CSSProperties {
  const isPinned = column.getIsPinned();
  if (!isPinned) return {};
  return {
    position: 'sticky',
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: isPinned ? 10 : undefined,
  };
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <slot name="toolbar">
      <DataTableToolbar
        v-if="showToolbar"
        :table="table"
        :search-query="remote.searchQuery.value"
        :filter-defs="remote.filterDefs"
        :filters="remote.filters.value"
        :active-filter-count="remote.activeFilterCount.value"
        @update:search-query="(val) => (remote.searchQuery.value = val)"
        @update:filter="(id, val) => remote.setFilter(id, val)"
        @reset="remote.resetFilters()"
      >
        <template #actions>
          <slot name="actions" />
        </template>
        <template #filters>
          <slot name="filters" />
        </template>
      </DataTableToolbar>
    </slot>

    <!-- Error State -->
    <div
      v-if="isError"
      class="flex flex-col items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-8 text-center"
    >
      <AlertCircle class="h-8 w-8 text-destructive" />
      <h3 class="mt-2 text-sm font-semibold text-destructive">
        Failed to load data
      </h3>
      <p class="mt-1 text-xs text-muted-foreground">
        {{ error?.message || 'An unexpected error occurred while fetching records.' }}
      </p>
      <Button
        variant="outline"
        size="sm"
        class="mt-4"
        @click="remote.refetch()"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>

    <!-- Table Container -->
    <div
      v-else
      ref="tableContainerRef"
      class="rounded-md border overflow-x-auto relative"
      :style="virtual ? { maxHeight: typeof virtualHeight === 'number' ? `${virtualHeight}px` : virtualHeight, overflowY: 'auto' } : undefined"
    >
      <Table>
        <TableHeader :class="virtual ? 'sticky top-0 z-30 bg-background shadow-xs' : ''">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="getPinningStyle(header.column)"
              :class="[
                densityClasses,
                header.column.getIsPinned() ? 'sticky z-20 bg-background/95 backdrop-blur' : '',
                header.column.getIsLastColumn('left') ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
                header.column.getIsFirstColumn('right') ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
              ]"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading Skeletons -->
          <template v-if="isLoading">
            <TableRow v-for="i in skeletonRows" :key="`skeleton-${i}`">
              <TableCell
                v-for="j in columnCount"
                :key="`skeleton-cell-${j}`"
                :class="densityClasses"
              >
                <Skeleton class="h-5 w-full" />
              </TableCell>
            </TableRow>
          </template>

          <!-- Actual Rows -->
          <template v-else-if="rows.length">
            <!-- Virtualized Rendering Mode -->
            <template v-if="virtual">
              <tr v-if="paddingTop > 0" aria-hidden="true">
                <td :colspan="columnCount" :style="{ height: `${paddingTop}px` }" class="p-0 border-0" />
              </tr>
              <TableRow
                v-for="virtualRow in virtualRows"
                :key="rows[virtualRow.index]?.id ?? virtualRow.index"
                :data-index="virtualRow.index"
                :data-state="rows[virtualRow.index]?.getIsSelected() ? 'selected' : undefined"
                :ref="(el) => rowVirtualizer?.measureElement(el as any)"
              >
                <TableCell
                  v-for="cell in rows[virtualRow.index]?.getVisibleCells() ?? []"
                  :key="cell.id"
                  :style="getPinningStyle(cell.column)"
                  :class="[
                    densityClasses,
                    cell.column.getIsPinned() ? 'sticky z-10 bg-background/95 backdrop-blur' : '',
                    cell.column.getIsLastColumn('left') ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
                    cell.column.getIsFirstColumn('right') ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
                  ]"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
              <tr v-if="paddingBottom > 0" aria-hidden="true">
                <td :colspan="columnCount" :style="{ height: `${paddingBottom}px` }" class="p-0 border-0" />
              </tr>
            </template>

            <!-- Standard Rendering Mode -->
            <template v-else>
              <TableRow
                v-for="row in rows"
                :key="row.id"
                :data-state="row.getIsSelected() ? 'selected' : undefined"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :style="getPinningStyle(cell.column)"
                  :class="[
                    densityClasses,
                    cell.column.getIsPinned() ? 'sticky z-10 bg-background/95 backdrop-blur' : '',
                    cell.column.getIsLastColumn('left') ? 'border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
                    cell.column.getIsFirstColumn('right') ? 'border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : '',
                  ]"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <!-- Empty State -->
          <template v-else>
            <TableRow>
              <TableCell :colspan="columnCount" class="h-24 text-center" :class="densityClasses">
                <slot name="empty">
                  {{ emptyMessage }}
                </slot>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <slot name="pagination">
      <DataTablePagination
        v-if="showPagination"
        :table="table"
        :total="remote.total.value"
      />
    </slot>

    <!-- Floating Bulk Actions Bar -->
    <slot
      name="floating-bar"
      :table="table"
      :selected-rows="table.getFilteredSelectedRowModel().rows"
      :selected-count="table.getFilteredSelectedRowModel().rows.length"
    >
      <DataTableFloatingBar
        v-if="showFloatingBar"
        :table="table"
        :total-count="remote.total.value"
      >
        <template #actions="slotProps">
          <slot name="bulk-actions" v-bind="slotProps" />
        </template>
      </DataTableFloatingBar>
    </slot>
  </div>
</template>
