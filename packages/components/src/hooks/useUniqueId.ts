import { useState } from 'react';

let uniqueIdCounter = 0;

/**
 * Returns a unique ID that will not change between component render cycles.
 * @param prefix - Prefix to add to the ID.
 *
 * @example
 * const id = useUniqueId();
 * //...
 * label({ htmlFor: id }, [...])
 * input({ id, ... })
 */
export const useUniqueId = (prefix = 'element'): string => {
  const [uniqueId] = useState(() => uniqueIdCounter++);
  return `${prefix}-${uniqueId}`;
};
