import _ from 'lodash/fp';
import { div } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

export const PageBoxVariants = {
  light: 'light',
};

export const PageBox = ({ children, variant, style = {}, ...props }) => {
  return div(
    _.merge(
      {
        style: {
          margin: '1.5rem',
          padding: '1.5rem 1.5rem 0',
          minHeight: 125,
          flex: 'none',
          zIndex: 0,
          ...(variant === PageBoxVariants.light ? { backgroundColor: colors.light(1), margin: 0, padding: '3rem 3rem 1.5rem' } : {}),
          ...style,
        },
      },
      props
    ),
    [children]
  );
};
