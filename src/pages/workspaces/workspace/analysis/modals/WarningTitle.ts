import { PropsWithChildren } from 'react';
import { div } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';

type WarningTitleProps = PropsWithChildren<{
  iconSize?: number;
}>;

export const WarningTitle = ({ children, iconSize = 36 }: WarningTitleProps) => {
  return div({ style: { display: 'flex', alignItems: 'center' } }, [
    icon('warning-standard', {
      size: iconSize,
      style: { color: colors.warning(), marginRight: '0.75rem' },
    }),
    children,
  ]);
};
