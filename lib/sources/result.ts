/**
 * Wraps a source-module result so we can cache failures alongside successes.
 * Without this, each failed fetch would re-hit the upstream on every request
 * (because `'use cache'` doesn't cache thrown errors).
 */
export interface SourceFetchResult<T> {
  items: T[];
  ok: boolean;
  error?: string;
  fetchedAt: string;
}

export function ok<T>(items: T[]): SourceFetchResult<T> {
  return { items, ok: true, fetchedAt: new Date().toISOString() };
}

export function fail<T>(err: unknown): SourceFetchResult<T> {
  return {
    items: [],
    ok: false,
    error: err instanceof Error ? err.message : String(err),
    fetchedAt: new Date().toISOString(),
  };
}
