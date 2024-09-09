import { Clickable, Icon } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import React from 'react';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';

export interface SnapshotActionMenuProps {
  onDelete: () => void;
}

const SnapshotActionMenu = (props: SnapshotActionMenuProps): ReactNode => {
  const { onDelete } = props;

  const menuContent = (
    <MenuButton disabled={false} onClick={onDelete}>
      {makeMenuIcon('trash')}
      Delete snapshot
    </MenuButton>
  );

  return (
    <MenuTrigger side='bottom' closeOnClick content={menuContent}>
      <Clickable
        aria-label='Snapshot action menu'
        aria-haspopup='menu'
        style={{ marginLeft: '1.5rem', marginRight: '0.5rem', opacity: 0.65, height: 27 }}
        hover={{ opacity: 1 }}
      >
        <Icon icon='cardMenuIcon' size={27} />
      </Clickable>
    </MenuTrigger>
  );
};

export default SnapshotActionMenu;
