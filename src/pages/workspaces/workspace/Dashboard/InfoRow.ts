import { PropsWithChildren, ReactNode } from 'react';
import { dd, div, dt } from 'react-hyperscript-helpers';

interface InfoRowProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
}

export const InfoRow = (props: InfoRowProps): ReactNode => {
  const { title, subtitle, children } = props;
  return div({ style: { display: 'flex', justifyContent: 'space-between', margin: '1rem 0.5rem' } }, [
    dt({ style: { width: 225 } }, [
      div({ style: { fontWeight: 500 } }, [title]),
      subtitle && div({ style: { fontWeight: 400, fontSize: 12 } }, [subtitle]),
    ]),
    dd({ style: { width: 225, display: 'flex', overflow: 'hidden' } }, [children]),
  ]);
};
