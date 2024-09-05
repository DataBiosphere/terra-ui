import { Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { Clickable, ClickableProps } from 'src/components/common';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';

interface GroupMenuProps {
  groupName: string;
  isAdmin: boolean;
  iconSize;
  popupLocation;
  callbacks: {
    onDelete: () => void;
    onLeave: () => void;
  };
}

export const GroupMenu = (props: GroupMenuProps): ReactNode => {
  const {
    groupName,
    isAdmin,
    iconSize,
    popupLocation,
    callbacks: { onDelete, onLeave },
  } = props;
  const navIconProps: Partial<ClickableProps> = {
    style: { opacity: 0.65, marginRight: '1rem', height: iconSize },
    hover: { opacity: 1 },
  };

  return (
    <MenuTrigger
      side={popupLocation}
      closeOnClick
      content={<GroupMenuContent isAdmin={isAdmin} onLeave={onLeave} onDelete={onDelete} />}
    >
      <Clickable
        aria-label={groupName ? `Action Menu for Group: ${groupName}` : 'Group Action Menu'}
        aria-haspopup='menu'
        {...navIconProps}
      >
        <Icon icon='cardMenuIcon' size={iconSize} />
      </Clickable>
    </MenuTrigger>
  );
};

const GroupMenuContent = ({ isAdmin, onLeave, onDelete }) => {
  return (
    <>
      <MenuButton onClick={onLeave}>
        {makeMenuIcon('arrowRight')}
        Leave
      </MenuButton>
      <MenuButton
        disabled={!isAdmin}
        tooltip={!isAdmin && 'You must be an admin of this group'}
        tooltipSide='left'
        onClick={onDelete}
      >
        {makeMenuIcon('trash')}
        Delete
      </MenuButton>
    </>
  );
};

export default GroupMenu;
