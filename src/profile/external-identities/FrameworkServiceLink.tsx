import { ClickableProps } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import * as Utils from 'src/libs/utils';

interface FrameworkServiceLinkProps extends Omit<ClickableProps, 'onClick'> {
  linkText: string;
  providerKey: string;
  redirectUrl: string;
  button?: boolean;
}

export const FrameworkServiceLink = (props: FrameworkServiceLinkProps): ReactNode => {
  const { linkText, providerKey, redirectUrl, button = false, ...clickableProps } = props;
  const Component = button ? ButtonPrimary : Link;
  const style = button ? {} : { display: 'inline-flex', alignItems: 'center' };
  return (
    <Component
      onClick={withErrorReporting('Error getting Fence Link')(async () => {
        const result = await Ajax().User.getFenceAuthUrl(providerKey, redirectUrl);
        window.open(result.url, Utils.newTabLinkProps.target, 'noopener,noreferrer');
      })}
      style={style}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...clickableProps}
    >
      {linkText}
      {icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })}
    </Component>
  );
};
