<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Button, Input } from '@tuquet/vue-ui';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';
import type { FilterDef } from '../types/index.js';
import DataTableFacetedFilter from './DataTableFacetedFilter.vue';
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

const facetedFilters = computed(() =>
  props.filterDefs.filter((f): f is Extract<FilterDef, { type: 'faceted' }> => f.type === 'faceted')
);

function getFilterValues(val: unknown): (string | number)[] {
  if (Array.isArray(val)) {
    return val as (string | number)[];
  }
  return [];
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

      <template v-for="filter in facetedFilters" :key="filter.id">
        <DataTableFacetedFilter
          v-if="Array.isArray(filter.options)"
          :title="filter.title"
          :options="filter.options"
          :model-value="getFilterValues(filters[filter.id])"
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
