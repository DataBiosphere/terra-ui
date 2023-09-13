import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Link, LinkProps } from 'src/components/common';
import { icon } from 'src/components/icons';

type EditDataLinkProps = Omit<LinkProps, 'children'>;

export const EditDataLink = (props: EditDataLinkProps): ReactNode =>
  h(
    Link,
    {
      className: 'cell-hover-only',
      style: { marginLeft: '1ch' },
      tooltip: 'Edit value',
      ...props,
    },
    [icon('edit')]
  );
