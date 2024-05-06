import { icon, Link, LinkProps } from '@terra-ui-packages/components';
import React from 'react';
import * as Utils from 'src/libs/utils';

export const LinkWithPopout = (props: LinkProps) => {
  const { children, ...otherProps } = props;
  return (
    <Link {...Utils.newTabLinkProps} style={{ display: 'inline-block', marginTop: '0.25rem' }} {...otherProps}>
      {children}
      {icon('pop-out', { size: 14, style: { marginLeft: '0.1rem' } })}
    </Link>
  );
};
