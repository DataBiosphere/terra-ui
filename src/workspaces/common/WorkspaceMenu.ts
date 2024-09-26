import { icon } from '@terra-ui-packages/components';
import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import { Fragment, ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { Metrics } from 'src/libs/ajax/Metrics';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { useWorkspaceDetails } from 'src/workspaces/common/state/useWorkspaceDetails';
import {
  CloudProvider,
  cloudProviderTypes,
  getCloudProviderFromWorkspace,
  isGoogleWorkspace,
  isOwner,
  WorkspacePolicy,
  WorkspaceState,
  WorkspaceWrapper as Workspace,
} from 'src/workspaces/utils';

const isNameType = (o: WorkspaceInfo): o is DynamicWorkspaceInfo =>
  'name' in o &&
  typeof o.name === 'string' &&
  'namespace' in o &&
  typeof o.namespace === 'string' &&
  Object.keys(o).length === 2;

type LoadedWorkspaceInfo = {
  state?: WorkspaceState;
  canShare: boolean;
  isLocked: boolean;
  isOwner: boolean;
  workspaceLoaded: boolean;
  cloudProvider?: CloudProvider;
  namespace: string;
  name: string;
};

type DynamicWorkspaceInfo = { name: string; namespace: string };
type WorkspaceInfo = DynamicWorkspaceInfo | LoadedWorkspaceInfo;

interface WorkspaceMenuCallbacks {
  onClone: (policies?: WorkspacePolicy[], bucketName?: string, description?: string, googleProject?: string) => void;
  onShare: (policies?: WorkspacePolicy[], bucketName?: string) => void;
  onLock: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onShowSettings: () => void;
}

export interface WorkspaceMenuProps {
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
        : h(LoadedWorkspaceMenuContent, { callbacks, workspaceInfo, origin: 'dashboard' }),
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

/**
 * DynamicWorkspaceInfo is invoked when the name/namespace is passed instead of the derived states.
 * This happens from the list component, which also needs the workspace policies and bucketName for
 * sharing and cloning the workspace. This is also leveraged to pass the full decription during cloning as well.
 */
const DynamicWorkspaceMenuContent = (props: DynamicWorkspaceMenuContentProps) => {
  const {
    workspaceInfo: { name, namespace },
    callbacks,
  } = props;
  const { workspace } = useWorkspaceDetails({ namespace, name }, [
    'accessLevel',
    'canShare',
    'policies',
    'workspace.bucketName',
    'workspace.attributes.description',
    'workspace.cloudPlatform',
    'workspace.googleProject',
    'workspace.isLocked',
    'workspace.state',
  ]) as { workspace?: Workspace };
  const bucketName = !!workspace && isGoogleWorkspace(workspace) ? workspace.workspace.bucketName : undefined;
  const googleProject = !!workspace && isGoogleWorkspace(workspace) ? workspace.workspace.googleProject : undefined;

  const descriptionText =
    !!workspace && workspace.workspace.attributes !== undefined
      ? (workspace.workspace.attributes.description as string)
      : undefined;

  return h(LoadedWorkspaceMenuContent, {
    workspaceInfo: {
      state: workspace?.workspace?.state,
      canShare: !!workspace?.canShare,
      isLocked: !!workspace?.workspace?.isLocked,
      isOwner: !!workspace && isOwner(workspace.accessLevel),
      workspaceLoaded: !!workspace,
      cloudProvider: !workspace ? undefined : getCloudProviderFromWorkspace(workspace),
      namespace,
      name,
    },
    // The list component doesn't fetch all the workspace details in order to keep the size of returned payload
    // as small as possible, so we need to pass policies and bucketName for use by the ShareWorkspaceModal
    // and NewWorkspaceModal (cloning, this will include the full description). The dashboard component already has the fields, so it will ignore them.
    callbacks: {
      ...callbacks,
      onShare: () => callbacks.onShare(workspace?.policies, bucketName),
      onClone: () => callbacks.onClone(workspace?.policies, bucketName, descriptionText, googleProject),
    },
    origin: 'list',
  });
};

export const tooltipText = {
  shareNoPermission: 'You have not been granted permission to share this workspace',
  deleteLocked: 'You cannot delete a locked workspace',
  deleteNoPermission: 'You must be an owner of this workspace or the underlying billing project',
  lockNoPermission: 'You have not been granted permission to lock this workspace',
  unlockNoPermission: 'You have not been granted permission to unlock this workspace',
  azureWorkspaceNoSettings: 'Settings are not available for Azure workspaces',
};

interface LoadedWorkspaceMenuContentProps {
  workspaceInfo: LoadedWorkspaceInfo;
  callbacks: {
    onClone: () => void;
    onShare: () => void;
    onLock: () => void;
    onDelete: () => void;
    onLeave: () => void;
    onShowSettings: () => void;
  };
  origin: 'dashboard' | 'list';
}
const LoadedWorkspaceMenuContent = (props: LoadedWorkspaceMenuContentProps) => {
  const {
    workspaceInfo: { state, canShare, isLocked, isOwner, workspaceLoaded, cloudProvider, namespace, name },
    callbacks: { onShare, onLock, onLeave, onClone, onDelete, onShowSettings },
    origin,
  } = props;
  const shareTooltip = cond([workspaceLoaded && !canShare, () => tooltipText.shareNoPermission], [DEFAULT, () => '']);
  const deleteTooltip = cond(
    [workspaceLoaded && isLocked, () => tooltipText.deleteLocked],
    [workspaceLoaded && !isOwner, () => tooltipText.deleteNoPermission],
    [DEFAULT, () => '']
  );

  const menuClicked = (action: string) => {
    void Metrics().captureEvent(Events.workspaceMenu, {
      action,
      origin,
      ...extractWorkspaceDetails({
        namespace,
        name,
        cloudPlatform: cloudProvider === cloudProviderTypes.GCP ? 'Gcp' : 'Azure',
      }),
    });
  };

  return h(Fragment, [
    h(
      MenuButton,
      {
        disabled:
          cloudProvider !== cloudProviderTypes.GCP ||
          !workspaceLoaded ||
          state === 'Deleting' ||
          state === 'DeleteFailed',
        onClick: () => {
          menuClicked('Settings');
          onShowSettings();
        },
        tooltipSide: 'left',
        tooltip: cloudProvider === cloudProviderTypes.AZURE ? tooltipText.azureWorkspaceNoSettings : '',
      },
      [makeMenuIcon('cog'), 'Settings']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || state === 'Deleting' || state === 'DeleteFailed',
        onClick: () => {
          menuClicked('Clone');
          onClone();
        },
      },
      [makeMenuIcon('copy'), 'Clone']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !canShare,
        tooltip: shareTooltip,
        tooltipSide: 'left',
        onClick: () => {
          menuClicked('Share');
          onShare();
        },
      },
      [makeMenuIcon('share'), 'Share']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !isOwner || state === 'Deleting' || state === 'DeleteFailed',
        tooltip: workspaceLoaded &&
          !isOwner && [isLocked ? tooltipText.unlockNoPermission : tooltipText.lockNoPermission],
        tooltipSide: 'left',
        onClick: () => {
          menuClicked(isLocked ? 'Unlock' : 'Lock');
          onLock();
        },
      },
      isLocked ? [makeMenuIcon('unlock'), 'Unlock'] : [makeMenuIcon('lock'), 'Lock']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || state === 'Deleting' || state === 'DeleteFailed',
        onClick: () => {
          menuClicked('Leave');
          onLeave();
        },
      },
      [makeMenuIcon('arrowRight'), 'Leave']
    ),
    h(
      MenuButton,
      {
        disabled: !workspaceLoaded || !isOwner || isLocked || state === 'Deleting',
        tooltip: deleteTooltip,
        tooltipSide: 'left',
        onClick: () => {
          menuClicked('Delete');
          onDelete();
        },
      },
      [makeMenuIcon('trash'), 'Delete']
    ),
  ]);
};
