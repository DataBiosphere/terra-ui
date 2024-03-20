import { PopupTrigger } from '@terra-ui-packages/components';
import { h, hr } from 'react-hyperscript-helpers';
import { VerticalNavigation } from 'src/components/keyboard-nav';
import colors from 'src/libs/colors';

export { makeMenuIcon } from '@terra-ui-packages/components';

export const MenuDivider = () =>
  hr({
    style: {
      borderWidth: '0 0 1px',
      borderStyle: 'solid',
      borderColor: colors.dark(0.55),
      margin: '0.25rem 0',
    },
  });

export const MenuTrigger = ({ children, content, popupProps = {}, ...props }) => {
  return h(
    PopupTrigger,
    {
      content: h(VerticalNavigation, [content]),
      popupProps: {
        role: 'menu',
        'aria-modal': undefined,
        'aria-orientation': 'vertical',
        ...popupProps,
      },
      ...props,
    },
    [children]
  );
};
