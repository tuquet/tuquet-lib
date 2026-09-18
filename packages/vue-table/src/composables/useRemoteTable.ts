import {
  type ColumnDef,
  type Row,
  type Table,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import {
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';
import { StandardRestAdapter } from '../adapters/standard-rest.js';
import type {
  ColumnSort,
  FetchParams,
  FetchResult,
  FilterDef,
  PaginationState,
  QueryAdapter,
  SortingState,
  TableState,
} from '../types/index.js';
import { useUrlSync } from './useUrlSync.js';

export type RowPredicate<TData> = string | number | ((item: TData, index: number) => boolean);

export type RowUpdater<TData> = Partial<TData> | ((item: TData, index: number) => TData);

export interface UseRemoteTableOptions<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  fetcher: (params: FetchParams) => Promise<FetchResult<TData>>;
  defaultPageSize?: number;
  syncWithUrl?: boolean;
  debounceMs?: number;
  adapter?: QueryAdapter;
  filters?: FilterDef[];
  initialState?: Partial<TableState>;
}

export interface UseRemoteTableReturn<TData> {
  table: Table<TData>;
  data: Ref<TData[]>;
  total: Ref<number>;
  pageCount: ComputedRef<number>;
  isLoading: Ref<boolean>;
  isFetching: Ref<boolean>;
  isError: Ref<boolean>;
  error: Ref<Error | null>;
  searchQuery: Ref<string>;
  filters: Ref<Record<string, unknown>>;
  activeFilterCount: ComputedRef<number>;
  filterDefs: FilterDef[];
  setFilter: (id: string, value: unknown) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;

  // Selection shortcuts
  selectedRows: ComputedRef<Row<TData>[]>;
  selectedRowIds: ComputedRef<string[]>;
  selectedCount: ComputedRef<number>;
  clearSelection: () => void;

  // Optimistic CRUD mutations
  mutateRow: (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => void;
  deleteRow: (predicateOrId: RowPredicate<TData> | (string | number)[]) => void;
  prependRow: (newRow: TData) => void;
  appendRow: (newRow: TData) => void;
  setData: (updaterOrValue: TData[] | ((prev: TData[]) => TData[]), newTotal?: number) => void;
}

export function useRemoteTable<TData, TValue = unknown>(
  options: UseRemoteTableOptions<TData, TValue>
): UseRemoteTableReturn<TData> {
  const {
    columns,
    fetcher,
    defaultPageSize = 10,
    syncWithUrl = true,
    debounceMs = 300,
    adapter = new StandardRestAdapter(),
    filters: filterDefs = [],
    initialState = {},
  } = options;

  const data = ref<TData[]>([]) as Ref<TData[]>;
  const total = ref(0);
  const isLoading = ref(true);
  const isFetching = ref(false);
  const isError = ref(false);
  const error = ref<Error | null>(null);

  // Table State
  const pagination = ref<PaginationState>({
    pageIndex: initialState.pagination?.pageIndex ?? 0,
    pageSize: initialState.pagination?.pageSize ?? defaultPageSize,
  });
  const sorting = ref<SortingState>(initialState.sorting ?? []);
  const columnFilters = ref<Record<string, unknown>>(initialState.filters ?? {});
  const searchQuery = ref<string>(initialState.search ?? '');
  const columnVisibility = ref<Record<string, boolean>>(initialState.columnVisibility ?? {});
  const rowSelection = ref<Record<string, boolean>>({});

  // URL Synchronization
  const urlSync = useUrlSync({
    adapter,
    enabled: syncWithUrl,
    onUrlChange: (newState) => {
      if (newState.pagination) pagination.value = newState.pagination;
      if (newState.sorting) sorting.value = newState.sorting;
      if (newState.filters) columnFilters.value = newState.filters;
      if (newState.search !== undefined) searchQuery.value = newState.search;
    },
  });

  // Apply initial state from URL if enabled
  if (syncWithUrl && typeof window !== 'undefined') {
    const urlState = urlSync.getInitialState();
    if (urlState.pagination) pagination.value = urlState.pagination;
    if (urlState.sorting) sorting.value = urlState.sorting;
    if (urlState.filters) columnFilters.value = urlState.filters;
    if (urlState.search !== undefined) searchQuery.value = urlState.search;
  }

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(total.value / pagination.value.pageSize));
  });

  const activeFilterCount = computed(() => {
    let count = 0;
    if (searchQuery.value && searchQuery.value.trim().length > 0) count += 1;
    for (const val of Object.values(columnFilters.value)) {
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val) && val.length === 0) continue;
        count += 1;
      }
    }
    return count;
  });

  let activeController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const executeFetch = async () => {
    if (activeController) {
      activeController.abort('New table query initiated');
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    isFetching.value = true;
    isError.value = false;
    error.value = null;

    const currentState: TableState = {
      pagination: pagination.value,
      sorting: sorting.value,
      filters: columnFilters.value,
      search: searchQuery.value,
      columnVisibility: columnVisibility.value,
    };

    if (syncWithUrl) {
      urlSync.updateUrl(currentState);
    }

    const queryParams = adapter.serialize(currentState);
    const offset = pagination.value.pageIndex * pagination.value.pageSize;

    const params: FetchParams = {
      page: pagination.value.pageIndex + 1,
      limit: pagination.value.pageSize,
      offset,
      sort: currentState.sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(','),
      search: currentState.search,
      filters: currentState.filters,
      signal,
      queryParams,
      toQueryString: () => {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(queryParams)) {
          if (v !== undefined && v !== null && v !== '') {
            sp.set(k, String(v));
          }
        }
        return sp.toString();
      },
    };

    try {
      const result = await fetcher(params);
      if (!signal.aborted) {
        data.value = result.data;
        total.value = result.total;
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      isError.value = true;
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      if (!signal.aborted) {
        isLoading.value = false;
        isFetching.value = false;
      }
    }
  };

  const scheduleFetch = (immediate = false) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (immediate || debounceMs <= 0) {
      executeFetch();
    } else {
      debounceTimer = setTimeout(() => {
        executeFetch();
      }, debounceMs);
    }
  };

  // TanStack Table Instance
  const table = useVueTable({
    get data() {
      return data.value;
    },
    columns,
    get pageCount() {
      return pageCount.value;
    },
    state: {
      get pagination() {
        return pagination.value;
      },
      get sorting() {
        return sorting.value;
      },
      get columnVisibility() {
        return columnVisibility.value;
      },
      get rowSelection() {
        return rowSelection.value;
      },
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: (updaterOrValue) => {
      pagination.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(pagination.value) : updaterOrValue;
      scheduleFetch(true);
    },
    onSortingChange: (updaterOrValue) => {
      sorting.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue;
      pagination.value.pageIndex = 0;
      scheduleFetch(true);
    },
    onColumnVisibilityChange: (updaterOrValue) => {
      columnVisibility.value =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(columnVisibility.value)
          : updaterOrValue;
    },
    onRowSelectionChange: (updaterOrValue) => {
      rowSelection.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue;
    },
    getCoreRowModel: getCoreRowModel(),
  });

  // Watchers for Search and Filters (reset page to 0 on filter change)
  watch(searchQuery, () => {
    pagination.value.pageIndex = 0;
    scheduleFetch(false); // debounced
  });

  watch(
    columnFilters,
    () => {
      pagination.value.pageIndex = 0;
      scheduleFetch(true); // immediate
    },
    { deep: true }
  );

  const setFilter = (id: string, value: unknown) => {
    columnFilters.value = {
      ...columnFilters.value,
      [id]: value,
    };
  };

  const resetFilters = () => {
    searchQuery.value = '';
    columnFilters.value = {};
  };

  const refetch = async () => {
    await executeFetch();
  };

  const invalidate = refetch;

  // Selection shortcuts
  const selectedRows = computed(() => table.getFilteredSelectedRowModel().rows);
  const selectedRowIds = computed(() =>
    Object.keys(rowSelection.value).filter((key) => rowSelection.value[key])
  );
  const selectedCount = computed(() => selectedRows.value.length);
  const clearSelection = () => table.resetRowSelection();

  // Helper to match row
  const matchRow = (item: TData, index: number, predicate: RowPredicate<TData>): boolean => {
    if (typeof predicate === 'function') {
      return predicate(item, index);
    }
    const candidate = item as Record<string, unknown>;
    return candidate?.id === predicate || candidate?._id === predicate;
  };

  // Optimistic CRUD mutations
  const mutateRow = (predicateOrId: RowPredicate<TData>, updater: RowUpdater<TData>) => {
    data.value = data.value.map((item, idx) => {
      if (!matchRow(item, idx, predicateOrId)) {
        return item;
      }
      if (typeof updater === 'function') {
        return updater(item, idx);
      }
      return { ...item, ...updater };
    });
  };

  const deleteRow = (predicateOrId: RowPredicate<TData> | (string | number)[]) => {
    const initialLength = data.value.length;
    if (Array.isArray(predicateOrId)) {
      const idSet = new Set(predicateOrId);
      data.value = data.value.filter((item) => {
        const candidate = item as Record<string, unknown>;
        const id = candidate?.id ?? candidate?._id;
        return !idSet.has(id as string | number);
      });
    } else {
      data.value = data.value.filter((item, idx) => !matchRow(item, idx, predicateOrId));
    }
    const deletedCount = initialLength - data.value.length;
    if (deletedCount > 0) {
      total.value = Math.max(0, total.value - deletedCount);
    }
  };

  const prependRow = (newRow: TData) => {
    data.value = [newRow, ...data.value];
    total.value += 1;
  };

  const appendRow = (newRow: TData) => {
    data.value = [...data.value, newRow];
    total.value += 1;
  };

  const setData = (updaterOrValue: TData[] | ((prev: TData[]) => TData[]), newTotal?: number) => {
    data.value = typeof updaterOrValue === 'function' ? updaterOrValue(data.value) : updaterOrValue;
    if (typeof newTotal === 'number') {
      total.value = newTotal;
    }
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      executeFetch();
    });
  } else {
    executeFetch();
  }

  return {
    table,
    data,
    total,
    pageCount,
    isLoading,
    isFetching,
    isError,
    error,
    searchQuery,
    filters: columnFilters,
    activeFilterCount,
    filterDefs,
    setFilter,
    resetFilters,
    refetch,
    invalidate,
    selectedRows,
    selectedRowIds,
    selectedCount,
    clearSelection,
    mutateRow,
    deleteRow,
    prependRow,
    appendRow,
    setData,
  };
}
