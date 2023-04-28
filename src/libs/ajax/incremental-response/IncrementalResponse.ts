/**
 * Represents a list of items that is progressively loaded one page at a time.
 *
 * items: Items loaded so far.
 * getNextPage: Load the next page of items. Returns an IncrementalResponse that contains the current items plus the next page of items.
 * hasNextPage: Whether or not there are more items left to load.
 */
export default interface IncrementalResponse<T> {
  items: T[];
  getNextPage(options?: { signal?: AbortSignal }): Promise<IncrementalResponse<T>>;
  hasNextPage: boolean;
}
