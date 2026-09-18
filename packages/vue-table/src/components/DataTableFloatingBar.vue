<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { Badge, Button, Separator } from '@tuquet/vue-ui';
import { onKeyStroke } from '@vueuse/core';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';

export interface DataTableFloatingBarProps<TData> {
  table: Table<TData>;
  /**
   * Total count of records if known
   */
  totalCount?: number;
}

const props = defineProps<DataTableFloatingBarProps<TData>>();

const emit = defineEmits<{
  clear: [];
}>();

const selectedRows = computed(() => props.table.getFilteredSelectedRowModel().rows);
const selectedCount = computed(() => selectedRows.value.length);
const isVisible = computed(() => selectedCount.value > 0);

function handleClear() {
  props.table.resetRowSelection();
  emit('clear');
}

onKeyStroke('Escape', (e) => {
  if (isVisible.value) {
    e.preventDefault();
    handleClear();
  }
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform translate-y-6 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-6 opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2 shadow-xl backdrop-blur-sm dark:border-border"
      role="toolbar"
      aria-label="Bulk actions toolbar"
    >
      <Badge variant="secondary" class="rounded-full px-2.5 py-0.5 text-xs font-semibold">
        <template v-if="totalCount">
          {{ selectedCount }} / {{ totalCount }} selected
        </template>
        <template v-else>
          {{ selectedCount }} selected
        </template>
      </Badge>

      <Separator orientation="vertical" class="h-4" />

      <div class="flex items-center gap-1.5">
        <slot name="actions" :selected-rows="selectedRows" :selected-count="selectedCount" :table="table" />
      </div>

      <Separator orientation="vertical" class="h-4" />

      <Button
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        title="Clear selection (Esc)"
        @click="handleClear"
      >
        <X class="mr-1 h-3.5 w-3.5" />
        <span>Clear</span>
        <kbd class="ml-1.5 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          Esc
        </kbd>
      </Button>
    </div>
  </Transition>
</template>
