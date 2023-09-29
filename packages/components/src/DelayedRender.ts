import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

export type DelayedRenderProps = PropsWithChildren<{
  delay?: number;
}>;

/**
 * Render children after a delay.
 *
 * @param props
 * @param props.delay - Delay in milliseconds before rendering chidlren.
 */
export const DelayedRender = (props: DelayedRenderProps): ReactNode => {
  const { children, delay = 1000 } = props;

  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return shouldRender ? children : null;
};
