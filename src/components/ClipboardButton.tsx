import { Clickable, ClickableProps } from '@terra-ui-packages/components';
import { delay } from '@terra-ui-packages/core-utils';
import * as clipboard from 'clipboard-polyfill/text';
import _ from 'lodash/fp';
import { PropsWithChildren, ReactNode, useState } from 'react';
import React from 'react';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Utils from 'src/libs/utils';

const styles = {
  clickableLink: {
    display: 'inline',
    color: colors.accent(),
    cursor: 'pointer',
    fontWeight: 500,
  },
};
interface ClipboardButtonProps extends PropsWithChildren<ClickableProps> {
  text: string;
  iconSize?: number;
}

interface LazyClipboardButtonProps extends PropsWithChildren<ClickableProps> {
  getText: () => Promise<string>;
  iconSize?: number;
}

export const ClipboardButton = (props: ClipboardButtonProps): ReactNode => {
  const { text, onClick, children, iconSize, ...rest } = props;
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <LazyClipboardButton getText={() => Promise.resolve(text)} iconSize={iconSize} onClick={onClick} {...rest}>
      {children}
    </LazyClipboardButton>
  );
};

export const LazyClipboardButton = (props: LazyClipboardButtonProps): ReactNode => {
  const { getText, children, iconSize, onClick, ...rest } = props;
  const [copied, setCopied] = useState(false);

  return (
    <Clickable
      tooltip={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      style={styles.clickableLink}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...rest}
      onClick={_.flow(
        withErrorReporting('Error copying to clipboard'),
        Utils.withBusyState(setCopied)
      )(async (e) => {
        onClick?.(e);
        const text = await getText();
        await clipboard.writeText(text);
        await delay(1500);
      })}
    >
      {children}
      {icon(copied ? 'check' : 'copy-to-clipboard', {
        size: iconSize,
        ...(!!children && { style: { marginLeft: '0.5rem' } }),
      })}
    </Clickable>
  );
};
