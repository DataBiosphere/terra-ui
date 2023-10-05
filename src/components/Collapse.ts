import { useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import { div, h, HTMLElementProps, WithDataAttributes } from 'react-hyperscript-helpers';
import { Link, LinkProps } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';

type DivProps = Omit<WithDataAttributes<HTMLElementProps<'div'>>, 'children'>;

type DivProps = JSX.InstrinsicElements['div'];

interface CollapseProps extends Omit<DivProps, 'title'> {
  title?: ReactNode;
  hover?: LinkProps['hover'];
  tooltip?: string;
  tooltipDelay?: number;
  summaryStyle?: CSSProperties;
  detailsStyle?: CSSProperties;
  initialOpenState?: boolean;
  titleFirst?: boolean;
  afterTitle?: ReactNode;
  onFirstOpen?: () => {};
  noTitleWrap?: boolean;
  disabled?: boolean;
  style?: DivProps['style'];
  onClick?: DivProps['onClick'];
}

const Collapse = (props: PropsWithChildren<CollapseProps>): ReactNode => {
  const {
    title,
    hover,
    tooltip,
    tooltipDelay,
    summaryStyle,
    detailsStyle,
    initialOpenState,
    children,
    titleFirst,
    afterTitle,
    onFirstOpen = () => {},
    noTitleWrap,
    disabled = false,
    ...rest
  } = props;
  const [isOpened, setIsOpened] = useState<boolean>(!!initialOpenState);
  const angleIcon = icon(isOpened ? 'angle-down' : 'angle-right', {
    style: {
      flexShrink: 0,
      marginLeft: titleFirst ? 'auto' : undefined,
      marginRight: titleFirst ? undefined : '0.25rem',
    },
  });

  const firstOpenRef = useRef(_.once(onFirstOpen));
  const id = useUniqueId();

  useEffect(() => {
    if (isOpened) {
      firstOpenRef.current();
    }
  }, [firstOpenRef, isOpened]);

  return div(rest, [
    div(
      {
        style: {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          ...summaryStyle,
        },
      },
      [
        !titleFirst && angleIcon,
        h(
          Link,
          {
            'aria-expanded': isOpened,
            'aria-controls': isOpened ? id : undefined,
            disabled,
            style: {
              color: colors.dark(),
              ...(noTitleWrap ? Style.noWrapEllipsis : {}),
            },
            onClick: () => setIsOpened(!isOpened),
            hover,
            tooltip,
            tooltipDelay,
          },
          [
            div({
              'aria-hidden': true,
              // zIndex: 1 lifts this element above angleIcon, so that clicking on the icon will toggle the Collapse.
              style: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 1 },
            }),
            title,
          ]
        ),
        // zIndex: 2 lifts afterTitle controls above the absolutely positioned div in Link so that they can be clicked.
        // display: flex and flex: 1 causes this div to fill available space. This makes it easy to position afterTitle
        // controls just after the summary text or at the right edge of the summary section. height: 0 prevents the unused
        // space in this div from blocking clicks on the summary section.
        afterTitle &&
          div({ style: { display: 'flex', flex: 1, alignItems: 'center', height: 0, margin: '0 1ch', zIndex: 2 } }, [
            afterTitle,
          ]),
        titleFirst && angleIcon,
      ]
    ),
    isOpened && div({ id, style: detailsStyle }, [children]),
  ]);
};

export default Collapse;
