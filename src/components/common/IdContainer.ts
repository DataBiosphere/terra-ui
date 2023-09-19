import _ from 'lodash/fp';
import { ReactElement, useState } from 'react';

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
