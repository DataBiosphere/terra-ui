import _ from 'lodash/fp';
import { Dispatch, Fragment, ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { analysisTabName } from 'src/analysis/runtime-common-components';
import { TabBar } from 'src/components/tabBars';
import * as Nav from 'src/libs/nav';
import {
  hasProtectedData,
  isAzureWorkspace,
  isGoogleWorkspace,
  isOwner,
  protectedDataMessage,
  regionConstraintMessage,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';
import { WorkspaceAttributeNotice } from 'src/pages/workspaces/workspace/WorkspaceAttributeNotice';
import { WorkspaceMenu } from 'src/pages/workspaces/workspace/WorkspaceMenu';

export interface WorkspaceTabsProps {
  namespace: string;
  name: string;
  workspace?: Workspace;
  activeTab?: string;
  refresh: () => void;
  setDeletingWorkspace: Dispatch<boolean>;
  setCloningWorkspace: Dispatch<boolean>;
  setSharingWorkspace: Dispatch<boolean>;
  setShowLockWorkspaceModal: Dispatch<boolean>;
  setLeavingWorkspace: Dispatch<boolean>;
}

export const WorkspaceTabs = (props: WorkspaceTabsProps): ReactNode => {
  const {
    workspace,
    activeTab,
    refresh,
    setDeletingWorkspace,
    setCloningWorkspace,
    setSharingWorkspace,
    setShowLockWorkspaceModal,
    setLeavingWorkspace,
  } = props;
  const { namespace, name } = props;
  const wsOwner = !!workspace && isOwner(workspace.accessLevel);
  const canShare = workspace?.canShare;
  const isLocked = !!workspace?.workspace.isLocked;
  const workspaceLoaded = !!workspace;

  const onClone = () => setCloningWorkspace(true);
  const onDelete = () => setDeletingWorkspace(true);
  const onLock = () => setShowLockWorkspaceModal(true);
  const onShare = () => setSharingWorkspace(true);
  const onLeave = () => setLeavingWorkspace(true);

  const tabs = getTabs(workspace);

  return h(Fragment, [
    h(
      TabBar,
      {
        'aria-label': 'Workspace Navigation Tabs',
        activeTab,
        refresh,
        tabNames: _.map('name', tabs),
        getHref: (currentTab) => Nav.getLink(_.find({ name: currentTab }, tabs)?.link ?? '', { namespace, name }),
      },
      [
        workspace &&
          h(WorkspaceAttributeNotice, {
            accessLevel: workspace.accessLevel,
            isLocked,
            workspaceProtectedMessage: hasProtectedData(workspace) ? protectedDataMessage : undefined,
            workspaceRegionConstraintMessage: regionConstraintMessage(workspace),
          }),
        h(WorkspaceMenu, {
          iconSize: 27,
          popupLocation: 'bottom',
          callbacks: { onClone, onShare, onLock, onDelete, onLeave },
          workspaceInfo: {
            state: workspace?.workspace?.state,
            canShare: !!canShare,
            isLocked,
            isOwner: wsOwner,
            workspaceLoaded,
          },
        }),
      ]
    ),
  ]);
};

const getTabs = (workspace?: Workspace): { name: string; link: string }[] => {
  const commonTabs = [
    { name: 'dashboard', link: 'workspace-dashboard' },
    { name: 'data', link: 'workspace-data' },
    { name: 'analyses', link: analysisTabName },
  ];

  if (workspace?.workspace?.state === 'Deleting' || workspace?.workspace?.state === 'DeleteFailed') {
    return [{ name: 'dashboard', link: 'workspace-dashboard' }];
  }
  if (!!workspace && isGoogleWorkspace(workspace)) {
    return [
      ...commonTabs,
      { name: 'workflows', link: 'workspace-workflows' },
      { name: 'job history', link: 'workspace-job-history' },
    ];
  }
  if (!!workspace && isAzureWorkspace(workspace)) {
    return [...commonTabs, { name: 'workflows', link: 'workspace-workflows-app' }];
  }
  return commonTabs;
};
