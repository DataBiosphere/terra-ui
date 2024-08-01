export const jsonBody = (body: any) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

export interface AbortOption {
  signal?: AbortSignal;
}

export type FetchFn = typeof fetch;
