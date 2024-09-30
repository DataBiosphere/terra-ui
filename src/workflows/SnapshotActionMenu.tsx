import { Clickable, Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';

export interface SnapshotActionMenuProps {
  /**
   * Whether the user is an owner of the workflow snapshot the actions in the
   * menu are for. Controls whether the following operations are enabled: delete
   */
  isSnapshotOwner: boolean;

  /** The action to be performed if the "Delete snapshot" button is pressed. */
  onDelete: () => void;
}

/**
 * A kebab (vertical three-dot) menu that displays buttons to perform actions on
 * a workflow snapshot.
 *
 * Currently supported actions: delete
 */
const SnapshotActionMenu = (props: SnapshotActionMenuProps): ReactNode => {
  const { isSnapshotOwner, onDelete } = props;

  const notSnapshotOwnerTooltip = 'You must be an owner of this snapshot';

  const menuContent = (
    <MenuButton
      disabled={!isSnapshotOwner}
      tooltip={!isSnapshotOwner && notSnapshotOwnerTooltip}
      tooltipSide='left'
      onClick={onDelete}
    >
      {makeMenuIcon('trash')}
      Delete snapshot
    </MenuButton>
  );

  return (
    <MenuTrigger side='bottom' closeOnClick content={menuContent}>
      <Clickable
        aria-label='Snapshot action menu'
        aria-haspopup='menu'
        style={{ opacity: 0.65, height: 27 }}
        hover={{ opacity: 1 }}
      >
        <Icon icon='cardMenuIcon' size={27} />
      </Clickable>
    </MenuTrigger>
  );
};

export default SnapshotActionMenu;
