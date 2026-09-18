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
  getCurrentScope,
  onMounted,
  onScopeDispose,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue';
import { StandardRestAdapter } from '../adapters/standard-rest.js';
import type {
  ColumnPinningState,
  ColumnSort,
  FetchParams,
  FetchResult,
  FilterDef,
  PaginationState,
  QueryAdapter,
  SortingState,
  TableState,
} from '../types/index.js';
import { useTableFilters } from './useTableFilters.js';
import { useTableMutations, type RowPredicate, type RowUpdater } from './useTableMutations.js';
import { useTablePagination } from './useTablePagination.js';
import { useTableSelection } from './useTableSelection.js';
import { useTableSorting } from './useTableSorting.js';
import { useUrlSync } from './useUrlSync.js';

export { type RowPredicate, type RowUpdater };

export interface UseRemoteTableOptions<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  fetcher: (params: FetchParams) => Promise<FetchResult<TData>>;
  defaultPageSize?: number;
  syncWithUrl?: boolean;
  debounceMs?: number;
  adapter?: QueryAdapter;
  filters?: FilterDef[];
  columnPinning?: ColumnPinningState;
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

  // Column Ergonomics
  columnPinning: Ref<ColumnPinningState>;
  setColumnPinning: (pinning: ColumnPinningState) => void;
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
  const isLoading = ref(true);
  const isFetching = ref(false);
  const isError = ref(false);
  const error = ref<Error | null>(null);

  // 1. Pagination Composable
  const { pagination, total, pageCount } = useTablePagination({
    initialPageIndex: initialState.pagination?.pageIndex ?? 0,
    initialPageSize: initialState.pagination?.pageSize ?? defaultPageSize,
    initialTotal: 0,
  });

  // 2. Sorting Composable
  const { sorting } = useTableSorting({
    initialSorting: initialState.sorting ?? [],
  });

  // 3. Filters Composable
  const {
    filters: columnFilters,
    searchQuery,
    activeFilterCount,
    setFilter,
    resetFilters,
  } = useTableFilters({
    initialFilters: initialState.filters ?? {},
    initialSearch: initialState.search ?? '',
    filterDefs,
  });

  // 4. Selection Composable
  const { rowSelection, selectedRowIds } = useTableSelection<TData>({
    initialSelection: {},
  });

  // 5. Column Visibility & Pinning
  const columnVisibility = ref<Record<string, boolean>>(initialState.columnVisibility ?? {});
  const columnPinning = ref<ColumnPinningState>(
    initialState.columnPinning ?? options.columnPinning ?? { left: [], right: [] }
  );

  // 6. Optimistic CRUD Mutations Composable
  const { mutateRow, deleteRow, prependRow, appendRow, setData } = useTableMutations<TData>({
    data,
    total,
  });

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
      columnPinning: columnPinning.value,
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
      get columnPinning() {
        return columnPinning.value;
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
    onColumnPinningChange: (updaterOrValue) => {
      columnPinning.value =
        typeof updaterOrValue === 'function' ? updaterOrValue(columnPinning.value) : updaterOrValue;
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

  const refetch = async () => {
    await executeFetch();
  };

  const invalidate = refetch;

  // Selection shortcuts derived from Table instance
  const selectedRows = computed<Row<TData>[]>(() => table.getFilteredSelectedRowModel().rows);
  const selectedCount = computed(() => selectedRows.value.length);
  const clearSelection = () => table.resetRowSelection();

  const setColumnPinning = (pinning: ColumnPinningState) => {
    columnPinning.value = pinning;
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      executeFetch();
    });
  } else {
    executeFetch();
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (activeController) {
        activeController.abort('Table composable disposed or unmounted');
        activeController = null;
      }
    });
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
    columnPinning,
    setColumnPinning,
  };
}
