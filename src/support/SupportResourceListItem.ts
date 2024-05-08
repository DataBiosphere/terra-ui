import { Clickable } from '@terra-ui-packages/components';
import * as qs from 'qs';
import { useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';
import { SupportResourceType } from 'src/support/SupportResourceType';

const listItemStyle = (selected, hovered) => {
  const style = {
    ...Style.navList.itemContainer(selected),
    ...Style.navList.item(selected),
    ...(selected ? { backgroundColor: colors.dark(0.1) } : {}),
    paddingLeft: '2rem',
  };
  if (hovered) {
    return {
      ...style,
      ...Style.navList.itemHover(selected),
    };
  }
  return style;
};

export interface SupportResourceListItemProps {
  resourceType: SupportResourceType;
  isActive: boolean;
}

export const SupportResourceListItem = (props: SupportResourceListItemProps) => {
  const [hovered, setHovered] = useState<boolean>();

  const { resourceType, isActive } = props;

  const supportResourceElement = span({ style: { wordBreak: 'break-all' } }, [resourceType.displayName]);

  const renderSupportResource = () =>
    div(
      {
        style: { ...listItemStyle(isActive, hovered) },
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      },
      [
        h(
          Clickable,
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              color: isActive ? colors.accent(1.1) : colors.accent(),
            },
            href: `${Nav.getLink('support')}?${qs.stringify({ selectedType: resourceType.resourceType })}`,
            'aria-current': isActive ? 'location' : false,
          },
          [supportResourceElement]
        ),
      ]
    );

  return div({ role: 'listitem' }, [renderSupportResource()]);
};
