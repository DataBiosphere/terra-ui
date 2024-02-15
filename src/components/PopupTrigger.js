import { PopupTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { h, hr } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { VerticalNavigation } from 'src/components/keyboard-nav';
import colors from 'src/libs/colors';

export const makeMenuIcon = (iconName, props) => {
  return icon(iconName, _.merge({ size: 15, style: { marginRight: '.3rem' } }, props));
};

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
