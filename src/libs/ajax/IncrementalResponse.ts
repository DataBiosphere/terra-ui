export default interface IncrementalResponse<T> {
  items: T[]
  getNextPage(options?: { signal?: AbortSignal }): Promise<IncrementalResponse<T>>
  hasNextPage: boolean
}
