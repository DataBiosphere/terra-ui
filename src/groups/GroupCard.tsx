import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { GroupMenu } from 'src/groups/GroupMenu';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import colors from 'src/libs/colors';
import { getLink } from 'src/libs/nav';
import * as Style from 'src/libs/style';

export const columnWidths = '1fr 30% 6rem 20px';

interface GroupCardProps {
  group: CurrentUserGroupMembership;
  onDelete: () => void;
  onLeave: () => void;
}

export const GroupCard = (props: GroupCardProps): ReactNode => {
  const {
    group: { groupName, groupEmail, role },
    onDelete,
    onLeave,
  } = props;
  const isAdmin = !!_.includes('admin', role);
  return (
    <div
      role='row'
      className='table-row'
      style={{ ...Style.cardList.longCardShadowless, margin: 0, display: 'grid', gridTemplateColumns: columnWidths }}
    >
      <div role='rowheader' style={{ marginRight: '1rem', ...Style.noWrapEllipsis }}>
        <a
          href={isAdmin ? getLink('group', { groupName }) : undefined}
          aria-disabled={!isAdmin}
          style={{ color: isAdmin ? colors.accent() : undefined }}
        >
          {groupName}
        </a>
      </div>
      <div role='cell' style={{ display: 'flex', overflow: 'hidden', alignItems: 'center' }}>
        <div style={{ ...Style.noWrapEllipsis, marginRight: '0.5rem' }}>{groupEmail}</div>
        <ClipboardButton
          aria-label='Copy group email to clipboard'
          text={groupEmail}
          className='hover-only'
          style={{ marginRight: '1rem' }}
        />
      </div>
      <div role='cell'>{isAdmin ? 'Admin' : 'Member'}</div>
      <div role='cell' style={{ display: 'flex', alignItems: 'center' }}>
        <GroupMenu
          iconSize={20}
          popupLocation='left'
          groupName={groupName}
          isAdmin={isAdmin}
          callbacks={{ onDelete, onLeave }}
        />
      </div>
    </div>
  );
};
