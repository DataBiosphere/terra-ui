import _ from 'lodash/fp';
import { useState } from 'react';

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
  const [uniqueId] = useState(() => _.uniqueId(''));
  return `${prefix}-${uniqueId}`;
};
