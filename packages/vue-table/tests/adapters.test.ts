import { describe, expect, it } from 'vitest';
import { LhsBracketsAdapter } from '../src/adapters/lhs-brackets.js';
import { StandardRestAdapter } from '../src/adapters/standard-rest.js';
import type { TableState } from '../src/types/index.js';

describe('StandardRestAdapter', () => {
  const adapter = new StandardRestAdapter();

  const mockState: TableState = {
    pagination: { pageIndex: 2, pageSize: 25 },
    sorting: [
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ],
    filters: {
      status: ['active', 'pending'],
      role: 'admin',
    },
    search: 'john doe',
  };

  it('serializes table state into standard REST query params', () => {
    const query = adapter.serialize(mockState);
    expect(query).toEqual({
      page: 3, // 1-indexed (pageIndex 2 -> page 3)
      limit: 25,
      sort: '-createdAt,name',
      q: 'john doe',
      status: 'active,pending',
      role: 'admin',
    });
  });

  it('deserializes standard REST query params back into table state', () => {
    const rawQuery = {
      page: '3',
      limit: '25',
      sort: '-createdAt,name',
      q: 'john doe',
      status: 'active,pending',
      role: 'admin',
    };

    const deserialized = adapter.deserialize(rawQuery);
    expect(deserialized.pagination).toEqual({ pageIndex: 2, pageSize: 25 });
    expect(deserialized.sorting).toEqual([
      { id: 'createdAt', desc: true },
      { id: 'name', desc: false },
    ]);
    expect(deserialized.search).toBe('john doe');
    expect(deserialized.filters).toEqual({
      status: ['active', 'pending'],
      role: 'admin',
    });
  });
});

describe('LhsBracketsAdapter', () => {
  const adapter = new LhsBracketsAdapter();

  const mockState: TableState = {
    pagination: { pageIndex: 0, pageSize: 15 },
    sorting: [{ id: 'priority', desc: true }],
    filters: {
      status: ['open', 'in_progress'],
      department: 'engineering',
    },
    search: 'bug',
  };

  it('serializes table state into LHS brackets query params', () => {
    const query = adapter.serialize(mockState);
    expect(query).toEqual({
      page: 1,
      limit: 15,
      'sort[priority]': 'desc',
      'filter[q]': 'bug',
      'filter[status][in]': 'open,in_progress',
      'filter[department]': 'engineering',
    });
  });

  it('deserializes LHS brackets query params back into table state', () => {
    const rawQuery = {
      page: '2',
      limit: '20',
      'sort[priority]': 'desc',
      'filter[q]': 'bug',
      'filter[status][in]': 'open,in_progress',
      'filter[department]': 'engineering',
    };

    const deserialized = adapter.deserialize(rawQuery);
    expect(deserialized.pagination).toEqual({ pageIndex: 1, pageSize: 20 });
    expect(deserialized.sorting).toEqual([{ id: 'priority', desc: true }]);
    expect(deserialized.search).toBe('bug');
    expect(deserialized.filters).toEqual({
      status: ['open', 'in_progress'],
      department: 'engineering',
    });
  });
});
