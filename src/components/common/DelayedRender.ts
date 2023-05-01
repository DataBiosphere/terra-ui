import { Fragment, PropsWithChildren, useEffect, useState } from 'react';
import { h } from 'react-hyperscript-helpers';

type DelayedRenderProps = PropsWithChildren<{
  delay?: number;
}>;

export function DelayedRender({ children = null, delay = 1000 }: DelayedRenderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setShouldRender(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return shouldRender ? h(Fragment, [children]) : null;
}
