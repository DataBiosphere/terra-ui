export interface AbortOption {
  signal?: AbortSignal;
}

export type FetchFn = typeof fetch;
