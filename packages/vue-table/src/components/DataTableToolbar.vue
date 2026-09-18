<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Button, Input } from '@tuquet/vue-ui';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';
import type { FilterDef } from '../types/index.js';
import DataTableDateRangeFilter, { type DateRangeValue } from './DataTableDateRangeFilter.vue';
import DataTableFacetedFilter from './DataTableFacetedFilter.vue';
import DataTableNumberRangeFilter, {
  type NumberRangeValue,
} from './DataTableNumberRangeFilter.vue';
import DataTableSelectFilter from './DataTableSelectFilter.vue';
import DataTableTextFilter, { type TextFilterValue } from './DataTableTextFilter.vue';
import DataTableViewOptions from './DataTableViewOptions.vue';

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchQuery?: string;
  filterDefs?: FilterDef[];
  filters?: Record<string, unknown>;
  activeFilterCount?: number;
  showViewOptions?: boolean;
}

const props = withDefaults(defineProps<DataTableToolbarProps<TData>>(), {
  searchPlaceholder: 'Filter records...',
  searchQuery: '',
  filterDefs: () => [],
  filters: () => ({}),
  activeFilterCount: 0,
  showViewOptions: true,
});

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:filter', id: string, val: unknown): void;
  (e: 'reset'): void;
}>();

function getFilterValues(val: unknown): (string | number)[] {
  if (Array.isArray(val)) {
    return val as (string | number)[];
  }
  return [];
}

function getSelectValue(val: unknown): string | number | undefined {
  if (typeof val === 'string' || typeof val === 'number') {
    return val;
  }
  return undefined;
}

function getDateRangeValue(val: unknown): DateRangeValue | undefined {
  if (val && typeof val === 'object') {
    return val as DateRangeValue;
  }
  return undefined;
}

function getNumberRangeValue(val: unknown): NumberRangeValue | undefined {
  if (val && typeof val === 'object') {
    return val as NumberRangeValue;
  }
  return undefined;
}

function getTextValue(val: unknown): TextFilterValue | string | undefined {
  if (typeof val === 'string' || (val && typeof val === 'object')) {
    return val as TextFilterValue | string;
  }
  return undefined;
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        :model-value="searchQuery"
        :placeholder="searchPlaceholder"
        class="h-8 w-[150px] lg:w-[250px]"
        @update:model-value="(val) => emit('update:searchQuery', String(val))"
      />

      <template v-for="filter in filterDefs" :key="filter.id">
        <!-- Faceted Filter -->
        <DataTableFacetedFilter
          v-if="filter.type === 'faceted' && Array.isArray(filter.options)"
          :title="filter.title"
          :options="filter.options"
          :model-value="getFilterValues(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Select Filter -->
        <DataTableSelectFilter
          v-else-if="filter.type === 'select'"
          :title="filter.title"
          :options="filter.options"
          :value="getSelectValue(filters[filter.id])"
          @update:value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Date Range Filter -->
        <DataTableDateRangeFilter
          v-else-if="filter.type === 'date-range'"
          :title="filter.title"
          :model-value="getDateRangeValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Number Range Filter -->
        <DataTableNumberRangeFilter
          v-else-if="filter.type === 'number-range'"
          :title="filter.title"
          :model-value="getNumberRangeValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />

        <!-- Text Filter -->
        <DataTableTextFilter
          v-else-if="filter.type === 'text'"
          :title="filter.title"
          :placeholder="filter.placeholder"
          :model-value="getTextValue(filters[filter.id])"
          @update:model-value="(val) => emit('update:filter', filter.id, val)"
        />
      </template>

      <Button
        v-if="activeFilterCount > 0"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="emit('reset')"
      >
        Reset
        <X class="ml-2 h-4 w-4" />
      </Button>

      <slot name="filters" />
    </div>

    <div class="flex items-center space-x-2">
      <slot name="actions" />
      <DataTableViewOptions v-if="showViewOptions" :table="table" />
    </div>
  </div>
</template>

