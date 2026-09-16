/**
 * Capitalizes the first character of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a given length and appends a suffix.
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (!str || str.length <= maxLength) return str;
  if (maxLength <= suffix.length) return str.slice(0, maxLength);
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Converts a string into a URL-friendly slug with Unicode normalization.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]+/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a string to camelCase.
 */
export function camelCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}
