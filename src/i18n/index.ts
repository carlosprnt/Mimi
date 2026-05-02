import { strings } from './strings';

export { strings };

/**
 * Resolve a dotted i18n path against the strings tree.
 * Centralizes copy access so we can swap to a real i18n library later
 * without rewriting call sites.
 */
export function t(path: string): string {
  const parts = path.split('.');
  let cursor: unknown = strings;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof cursor === 'string' ? cursor : path;
}
