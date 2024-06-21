import { ReactNode } from 'react';

import { Icon } from './Icon';
import { Link, LinkProps } from './Link';

export interface ExternalLinkProps extends LinkProps {
  includeReferrer?: boolean;
}

export const ExternalLink = (props: ExternalLinkProps): ReactNode => {
  const { children, includeReferrer, ...otherProps } = props;

  const rel = `noopener${includeReferrer ? '' : ' noreferrer'}`;

  return (
    <Link rel={rel} target='_blank' {...otherProps}>
      {children}
      <Icon icon='pop-out' size={12} style={{ marginLeft: '0.25rem' }} />
    </Link>
  );
};
