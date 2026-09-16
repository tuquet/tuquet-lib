import { describe, it, expect } from 'vitest';
import { capitalize, truncate, slugify, camelCase } from '../src/string.js';

describe('string utils', () => {
  describe('capitalize', () => {
    it('capitalizes the first letter', () => {
      expect(capitalize('tuquet')).toBe('Tuquet');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates strings longer than maxLength', () => {
      expect(truncate('Hello world from Tuquet', 10)).toBe('Hello w...');
    });

    it('returns original string if within length', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('handles maxLength shorter than suffix without buffer underflow', () => {
      expect(truncate('Hello', 2, '...')).toBe('He');
    });
  });

  describe('slugify', () => {
    it('converts titles into clean slugs', () => {
      expect(slugify('Hello World from Tuquet Lib!')).toBe('hello-world-from-tuquet-lib');
    });

    it('trims leading and trailing hyphens', () => {
      expect(slugify('---hello world---')).toBe('hello-world');
    });

    it('normalizes unicode characters', () => {
      expect(slugify('café crème')).toBe('cafe-creme');
    });
  });

  describe('camelCase', () => {
    it('converts hyphenated, underscore, or space-separated words to camelCase', () => {
      expect(camelCase('tuquet-library-mono')).toBe('tuquetLibraryMono');
      expect(camelCase('tuquet_library_mono')).toBe('tuquetLibraryMono');
      expect(camelCase('tuquet library mono')).toBe('tuquetLibraryMono');
    });
  });
});
