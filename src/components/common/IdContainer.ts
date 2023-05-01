import _ from 'lodash/fp';
import { ReactElement, useMemo, useState } from 'react';

type IdContainerProps = {
  children: (id: string) => ReactElement<any, any> | null;
};

/**
 * DEPRECATED - should switch to useUniqueId pattern (below)
 */
export const IdContainer = ({ children }: IdContainerProps) => {
  const [id] = useState(() => _.uniqueId('element-'));
  return children(id);
};

/**
 * returns a durable unique id that will not chance between component render cycles.
 * @example
 * // inside a react component:
 * const thingOneId = useUniqueId('thing-one')
 * const otherId = useUniqueId()
 * //...
 * div({ id: thingOneId }, [...],
 * div({ id: otherId }, [...]
 * // will produce ids:
 * // thing-one-123
 * // element-124
 */
export const useUniqueId = (prefix = 'element'): string => {
  const uniqueId: string = useMemo(() => _.uniqueId(''), []);
  return `${prefix}-${uniqueId}`;
};
