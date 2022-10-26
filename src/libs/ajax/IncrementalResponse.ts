export default interface IncrementalResponse<T> {
  results: T[]
  getNextPage(options?: { signal?: AbortSignal }): Promise<IncrementalResponse<T>>
  hasNextPage: boolean
}
