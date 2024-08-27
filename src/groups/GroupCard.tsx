import _ from 'lodash/fp';
import { a, div, h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import GroupMenu from 'src/groups/GroupMenu';
import { columnWidths } from 'src/groups/List';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { memoWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';

export const GroupCard = memoWithName('GroupCard', ({ group: { groupName, groupEmail, role }, onDelete, onLeave }) => {
  const isAdmin = !!_.includes('admin', role);

  return div(
    {
      role: 'row',
      className: 'table-row',
      style: { ...Style.cardList.longCardShadowless, margin: 0, display: 'grid', gridTemplateColumns: columnWidths },
    },
    [
      div({ role: 'rowheader', style: { marginRight: '1rem', ...Style.noWrapEllipsis } }, [
        a(
          {
            href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
            'aria-disabled': !isAdmin,
            style: {
              ...Style.cardList.longTitle,
              color: isAdmin ? colors.accent() : undefined,
            },
          },
          [groupName]
        ),
      ]),
      div({ role: 'cell', style: { display: 'flex', overflow: 'hidden', alignItems: 'center' } }, [
        div({ style: { ...Style.noWrapEllipsis, marginRight: '0.5rem' } }, [groupEmail]),
        h(ClipboardButton, {
          'aria-label': 'Copy group email to clipboard',
          text: groupEmail,
          className: 'hover-only',
          style: { marginRight: '1rem' },
        }),
      ]),
      div({ role: 'cell' }, [isAdmin ? 'Admin' : 'Member']),
      div({ role: 'cell', style: { display: 'flex', alignItems: 'center' } }, [
        h(GroupMenu, {
          iconSize: 20,
          popupLocation: 'left',
          groupName,
          isAdmin,
          callbacks: { onDelete, onLeave },
        }),
      ]),
    ]
  );
});
