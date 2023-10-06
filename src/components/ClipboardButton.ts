import { delay } from '@terra-ui-packages/core-utils';
import * as clipboard from 'clipboard-polyfill/text';
import _ from 'lodash/fp';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Link, LinkProps } from 'src/components/common';
import { icon } from 'src/components/icons';
import { withErrorReporting } from 'src/libs/error';
import * as Utils from 'src/libs/utils';

interface ClipboardButtonProps extends PropsWithChildren<LinkProps> {
  text: string;
  iconSize?: number;
}

export const ClipboardButton = (props: ClipboardButtonProps): ReactNode => {
  const { text, onClick, children, iconSize, ...rest } = props;
  const [copied, setCopied] = useState(false);
  return h(
    Link,
    {
      tooltip: copied ? 'Copied to clipboard' : 'Copy to clipboard',
      ...rest,
      onClick: _.flow(
        withErrorReporting('Error copying to clipboard'),
        Utils.withBusyState(setCopied)
      )(async (e) => {
        onClick?.(e);
        await clipboard.writeText(text);
        await delay(1500);
      }),
    },
    [
      children,
      icon(copied ? 'check' : 'copy-to-clipboard', {
        size: iconSize,
        ...(!!children && { style: { marginLeft: '0.5rem' } }),
      }),
    ]
  );
};
