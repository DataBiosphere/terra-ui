import { useUniqueId } from '@terra-ui-packages/components';
import { ReactNode } from 'react';

type IdContainerProps = {
  children: (id: string) => ReactNode;
};

/**
 * DEPRECATED - should switch to useUniqueId pattern (below)
 */
export const IdContainer = ({ children }: IdContainerProps): ReactNode => {
  const id = useUniqueId();
  return children(id);
};
