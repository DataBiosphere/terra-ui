import { Icon, Link } from '@terra-ui-packages/components';
import React from 'react';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

interface ExternalLinkProps {
  text: React.ReactNode;
  url: string;
  popoutSize?: number;
  style?: React.CSSProperties;
}

export const ExternalLink = ({ text, url, popoutSize = 14, ...props }: ExternalLinkProps) => (
  <Link {...Utils.newTabLinkProps} style={{ color: colors.accent(), ...props.style }} href={url}>
    {text}
    <Icon icon='pop-out' style={{ marginLeft: '0.25rem' }} size={popoutSize} />
  </Link>
);
