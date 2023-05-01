import * as _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import colors from 'src/libs/colors';
import { forwardRefWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';

export const SkipNavLink = forwardRefWithName('SkipNavLink', (props = {}, ref) => {
  return h(
    Link,
    _.merge(
      {
        as: 'a',
        href: '#',
        className: 'reveal-on-focus',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          background: 'white',
          color: colors.accent(),
          border: '1px solid',
          borderColor: colors.accent(),
          padding: '1rem',
          boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 4px 0px',
          zIndex: 9998, // This link must appear above anything else on the page except SkipNavTarget's focus ring, which has z-index 9999
        },
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          ref.current?.focus();
        },
      },
      props
    ),
    'Skip to main content'
  );
});

export const SkipNavTarget = forwardRefWithName('SkipNavTarget', (props = {}, ref) => {
  return div({
    ref,
    role: 'note',
    'aria-label': 'main content starts here',
    tabIndex: -1,
    style: {
      position: 'absolute',
      top: Style.topBarHeight, // Push this down below the header
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999, // In order to look right, this focus ring must appear above all other content, including the button, which has z-index 9998
      outlineOffset: '-2px',
      pointerEvents: 'none' /* Allow clicks to pass through */,
    },
    ...props,
  });
});
