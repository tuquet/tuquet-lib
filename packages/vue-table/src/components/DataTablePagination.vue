<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tuquet/ui';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next';
import { computed } from 'vue';

interface DataTablePaginationProps {
  table: Table<unknown>;
  total?: number;
  pageSizeOptions?: number[];
  showSelectedCount?: boolean;
}

const props = withDefaults(defineProps<DataTablePaginationProps>(), {
  total: 0,
  pageSizeOptions: () => [10, 20, 30, 40, 50, 100],
  showSelectedCount: true,
});

const pageIndex = computed(() => props.table.getState().pagination.pageIndex);
const pageSize = computed(() => props.table.getState().pagination.pageSize);
const pageCount = computed(() => props.table.getPageCount());

const selectedRowsCount = computed(
  () => Object.keys(props.table.getState().rowSelection ?? {}).length
);
</script>

<template>
  <div class="flex items-center justify-between px-2 py-4">
    <div v-if="showSelectedCount" class="flex-1 text-sm text-muted-foreground">
      <template v-if="selectedRowsCount > 0">
        {{ selectedRowsCount }} row(s) selected.
      </template>
      <template v-else-if="total > 0">
        Total {{ total }} record(s).
      </template>
    </div>
    <div v-else class="flex-1" />

    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">Rows per page</p>
        <Select
          :model-value="`${pageSize}`"
          @update:model-value="(val) => table.setPageSize(Number(val))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="size in pageSizeOptions"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex w-[100px] items-center justify-center text-sm font-medium">
        Page {{ pageIndex + 1 }} of {{ pageCount }}
      </div>

      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Go to first page</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Go to previous page</span>
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Go to next page</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(pageCount - 1)"
        >
          <span class="sr-only">Go to last page</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
