import type { Component } from 'vue';

export interface FacetedFilterOption<T = string | number> {
  label: string;
  value: T;
  icon?: Component;
  count?: number;
}

export interface BaseFilterDef {
  id: string;
  title: string;
}

export interface FacetedFilterDef<T = string | number> extends BaseFilterDef {
  type: 'faceted';
  options: FacetedFilterOption<T>[] | (() => Promise<FacetedFilterOption<T>[]>);
}

export interface SelectFilterDef<T = string | number> extends BaseFilterDef {
  type: 'select';
  options: FacetedFilterOption<T>[];
}

export interface DateRangeFilterDef extends BaseFilterDef {
  type: 'date-range';
}

export interface NumberRangeFilterDef extends BaseFilterDef {
  type: 'number-range';
  min?: number;
  max?: number;
}

export interface TextFilterDef extends BaseFilterDef {
  type: 'text';
  placeholder?: string;
}

export type FilterDef =
  FacetedFilterDef | SelectFilterDef | DateRangeFilterDef | NumberRangeFilterDef | TextFilterDef;
