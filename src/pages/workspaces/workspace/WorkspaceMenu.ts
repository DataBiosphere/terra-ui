import { icon } from '@terra-ui-packages/components';
import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import { Fragment } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { useWorkspaceDetails } from 'src/components/workspace-utils';
import { isOwner, WorkspacePolicy, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

const isNameType = (o: WorkspaceInfo): o is DynamicWorkspaceInfo =>
  'name' in o && typeof o.name === 'string' && 'namespace' in o && typeof o.namespace === 'string';

type LoadedWorkspaceInfo = { canShare: boolean; isLocked: boolean; isOwner: boolean; workspaceLoaded: boolean };
type DynamicWorkspaceInfo = { name: string; namespace: string };
type WorkspaceInfo = DynamicWorkspaceInfo | LoadedWorkspaceInfo;

interface WorkspaceMenuCallbacks {
  onClone: () => void;
  onShare: (policies?: WorkspacePolicy[]) => void;
  onLock: () => void;
  onDelete: () => void;
  onLeave: () => void;
}

interface WorkspaceMenuProps {
  iconSize?: number;
  popupLocation: unknown; // will error whenever PopupTrigger.js is converted to ts
  callbacks: WorkspaceMenuCallbacks;
  workspaceInfo: WorkspaceInfo;
}
// In `workspaceInfo`, specify either `name and namespace` to fetch the Workspace details,
// or `canShare, isLocked, and isOwner` to use previously fetched details.
export const WorkspaceMenu = (props: WorkspaceMenuProps): ReactNode => {
  const { iconSize, popupLocation, callbacks, workspaceInfo } = props;

  const navIconProps = {
    style: { opacity: 0.65, marginRight: '1rem', height: iconSize },
    hover: { opacity: 1 },
    focus: 'hover',
  };

  return h(
    MenuTrigger,
    {
      side: popupLocation,
      closeOnClick: true,
      content: isNameType(workspaceInfo)
        ? h(DynamicWorkspaceMenuContent, { callbacks, workspaceInfo })
        : h(LoadedWorkspaceMenuContent, { callbacks, workspaceInfo }),
    },
    [
      h(
        Clickable,
        {
          'aria-label': isNameType(workspaceInfo)
            ? `Action Menu for Workspace: ${workspaceInfo.name}`
            : 'Workspace Action Menu',
          'aria-haspopup': 'menu',
          ...navIconProps,
        },
        [icon('cardMenuIcon', { size: iconSize })]
      ),
    ]
  );
};

interface DynamicWorkspaceMenuContentProps {
  workspaceInfo: DynamicWorkspaceInfo;
  callbacks: WorkspaceMenuCallbacks;
}

const DynamicWorkspaceMenuContent = (props: DynamicWorkspaceMenuContentProps) => {
  const {
    workspaceInfo: { name, namespace },
    callbacks,
  } = props;
  const { workspace } = useWorkspaceDetails({ namespace, name }, [
    'accessLevel',
    'policies',
    'canShare',
    'workspace.isLocked',
  ]) as { workspace?: Workspace };

  return h(LoadedWorkspaceMenuContent, {
    workspaceInfo: {
      canShare: !!workspace?.canShare,
      isLocked: !!workspace?.workspace.isLocked,
      isOwner: !!workspace && isOwner(workspace.accessLevel),
      workspaceLoaded: !!workspace,
    },
    // the list component doesn't have workspace details, so we need to pass policies so it can add it for the ShareWorkspaceModal modal
    // the dashboard component already has the field, so it will ignore the parameter of onShare
    callbacks: { ...callbacks, onShare: () => callbacks.onShare(workspace?.policies) },
  });
};

export const tooltipText = {
  shareNoPermission: 'You have not been granted permission to share this workspace',
  deleteLocked: 'You cannot delete a locked workspace',
  deleteNoPermission: 'You must be an owner of this workspace or the underlying billing project',
  lockNoPermission: 'You have not been granted permission to lock this workspace',
  unlockNoPermission: 'You have not been granted permission to unlock this workspace',
};

interface LoadedWorkspaceMenuContentProps {
  workspaceInfo: LoadedWorkspaceInfo;
  callbacks: WorkspaceMenuCallbacks;
}
const LoadedWorkspaceMenuContent = (props: LoadedWorkspaceMenuContentProps) => {
  const {
    workspaceInfo: { canShare, isLocked, isOwner, workspaceLoaded },
    callbacks: { onShare, onLock, onLeave, onClone, onDelete },
  } = props;
  const shareTooltip = cond([workspaceLoaded && !canShare, () => tooltipText.shareNoPermission], [DEFAULT, () => '']);
  const deleteTooltip = cond(
    [workspaceLoaded && isLocked, () => tooltipText.deleteLocked],
    [workspaceLoaded && !isOwner, () => tooltipText.deleteNoPermission],
    [DEFAULT, () => '']
  );

  return h(Fragment, [
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded,
        tooltipSide: 'left',
        onClick: onClone,
      },
      [makeMenuIcon('copy'), 'Clone']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !canShare,
        tooltip: shareTooltip,
        tooltipSide: 'left',
        onClick: () => onShare,
      },
      [makeMenuIcon('share'), 'Share']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !isOwner,
        tooltip: workspaceLoaded &&
          !isOwner && [isLocked ? tooltipText.unlockNoPermission : tooltipText.lockNoPermission],
        tooltipSide: 'left',
        onClick: onLock,
      },
      isLocked ? [makeMenuIcon('unlock'), 'Unlock'] : [makeMenuIcon('lock'), 'Lock']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded,
        onClick: onLeave,
      },
      [makeMenuIcon('arrowRight'), 'Leave']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !isOwner || isLocked,
        tooltip: deleteTooltip,
        tooltipSide: 'left',
        onClick: onDelete,
      },
      [makeMenuIcon('trash'), 'Delete']
    ),
  ]);
};

export default WorkspaceMenu;
