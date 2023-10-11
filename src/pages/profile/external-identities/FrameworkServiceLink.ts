import { ClickableProps } from '@terra-ui-packages/components';
import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

interface FrameworkServiceLinkProps extends ClickableProps {
  linkText: string;
  provider: string;
  redirectUrl: string;
  button?: boolean;
}

export const FrameworkServiceLink = ({
  linkText,
  provider,
  redirectUrl,
  button = false,
  ...props
}: FrameworkServiceLinkProps) => {
  const [href, setHref] = useState<string>();

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting('Error getting Fence Link', async () => {
      const result = await Ajax().User.getFenceAuthUrl(provider, redirectUrl);
      setHref(result.url);
    });
    loadAuthUrl();
  });

  return href
    ? h(
        button ? ButtonPrimary : Link,
        {
          href,
          ...(button ? {} : { style: { display: 'inline-flex', alignItems: 'center' } }),
          ...Utils.newTabLinkProps,
          ...props,
        },
        [linkText, icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })]
      )
    : h(Fragment, [linkText]);
};
