import { ClickableProps } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { getConfig } from 'src/libs/config';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

interface ShibbolethLinkProps extends ClickableProps {
  button?: boolean;
  children: React.ReactNode[] | React.ReactNode;
}

export const ShibbolethLink = ({ button = false, children, ...props }: ShibbolethLinkProps) => {
  const nihRedirectUrl = `${window.location.origin}/${Nav.getLink('profile')}?nih-username-token=<token>`;
  return h(
    button ? ButtonPrimary : Link,
    _.merge(
      {
        href: `${getConfig().shibbolethUrlRoot}/login?${qs.stringify({ 'return-url': nihRedirectUrl })}`,
        ...(button ? {} : { style: { display: 'inline-flex', alignItems: 'center' } }),
        ...Utils.newTabLinkProps,
      },
      props
    ),
    [children, icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })]
  );
};
