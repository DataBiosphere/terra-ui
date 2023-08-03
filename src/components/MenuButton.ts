import { CSSProperties } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Clickable, ClickableProps } from 'src/components/common';
import colors from 'src/libs/colors';
import { forwardRefWithName } from 'src/libs/react-utils';

type MenuButtonProps = ClickableProps;

const MenuButtonInternal = ({ disabled, children, ...props }: MenuButtonProps, ref) => {
  return div({ role: 'menuitem' }, [
    h(
      Clickable,
      {
        ref,
        disabled,
        style: {
          display: 'flex',
          alignItems: 'center',
          fontSize: 12,
          minWidth: 125,
          height: '2.25rem',
          padding: '0.875rem',
          ...(disabled ? { color: colors.dark(0.7), cursor: 'not-allowed' } : { cursor: 'pointer' }),
        } as CSSProperties,
        hover: !disabled ? { backgroundColor: colors.light(0.4), color: colors.accent() } : undefined,
        ...props,
      },
      [children]
    ),
  ]);
};

export const MenuButton = forwardRefWithName('MenuButton', MenuButtonInternal) as React.FC<MenuButtonProps>;
