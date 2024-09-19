import { Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, PropsWithChildren, ReactNode, Ref, useEffect, useRef, useState } from 'react';
import { div, h, h2, h3, p, span } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import AnalysisNotificationManager from 'src/analysis/AnalysisNotificationManager';
import { ContextBar } from 'src/analysis/ContextBar';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import TitleBar from 'src/components/TitleBar';
import { TopBar } from 'src/components/TopBar';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { withDisplayName } from 'src/libs/react-utils';
import { getTerraUser, workspaceStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useAppPolling } from 'src/workspaces/common/state/useAppPolling';
import { useCloningWorkspaceNotifications } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { useCloudEnvironmentPolling } from 'src/workspaces/common/state/useCloudEnvironmentPolling';
import { InitializedWorkspaceWrapper, StorageDetails, useWorkspace } from 'src/workspaces/common/state/useWorkspace';
import { useWorkspaceStatePolling } from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspaceContainerModals } from 'src/workspaces/container/WorkspaceContainerModals';
import { WorkspaceDeletingBanner } from 'src/workspaces/container/WorkspaceDeletingBanner';
import { WorkspaceTabs } from 'src/workspaces/container/WorkspaceTabs';
import { azureControlledAccessRequestMessage, isGoogleWorkspace } from 'src/workspaces/utils';

const TitleBarSpinner = (props: PropsWithChildren): ReactNode => {
  return h(TitleBar, {
    title: div({ role: 'alert', style: { display: 'flex', alignItems: 'center' } }, [
      h(Spinner, {
        size: 64,
        style: {
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.warning(0.1),
          padding: '1rem',
          borderRadius: '0.5rem',
        },
      }),
      span({ style: { color: colors.dark(), fontSize: 14 } }, [props.children]),
    ]),
    style: { backgroundColor: colors.warning(0.1), borderBottom: `1px solid ${colors.warning()}` },
    onDismiss: () => {},
  });
};

const GooglePermissionsSpinner = (): ReactNode => {
  const warningMessage = ['Terra is synchronizing permissions with Google. This may take a couple moments.'];

  return h(TitleBarSpinner, warningMessage);
};

interface WorkspaceContainerProps extends PropsWithChildren {
  namespace: string;
  name: string;
  activeTab?: string;
  analysesData: AnalysesData;
  storageDetails: StorageDetails;
  refresh: () => Promise<void>;
  workspace: InitializedWorkspaceWrapper;
  refreshWorkspace: () => void;
}

export const WorkspaceContainer = (props: WorkspaceContainerProps) => {
  const {
    namespace,
    name,
    activeTab,
    analysesData: {
      apps = [],
      refreshApps,
      runtimes = [],
      refreshRuntimes,
      appDataDisks = [],
      persistentDisks = [],
      isLoadingCloudEnvironments,
    },
    storageDetails,
    refresh,
    workspace,
    refreshWorkspace,
    children,
  } = props;
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [cloningWorkspace, setCloningWorkspace] = useState(false);
  const [sharingWorkspace, setSharingWorkspace] = useState(false);
  const [showLockWorkspaceModal, setShowLockWorkspaceModal] = useState(false);
  const [leavingWorkspace, setLeavingWorkspace] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isGoogleWorkspaceSyncing = isGoogleWorkspace(workspace) && workspace.workspaceInitialized === false;

  useCloningWorkspaceNotifications();
  useWorkspaceStatePolling([workspace], 'Ready');

  useEffect(() => {
    if (workspace.workspace.state === 'Deleted') {
      Nav.goToPath('workspaces');
      workspaceStore.reset();
    }
  }, [workspace]);

  return h(Fragment, [
    h(AnalysisNotificationManager, { namespace, name, runtimes, apps }),
    h(WorkspaceTabs, {
      namespace,
      name,
      activeTab,
      refresh,
      workspace,
      setDeletingWorkspace,
      setCloningWorkspace,
      setLeavingWorkspace,
      setSharingWorkspace,
      setShowLockWorkspaceModal,
      setShowSettingsModal,
    }),
    h(WorkspaceDeletingBanner, { workspace }),
    isGoogleWorkspaceSyncing && h(GooglePermissionsSpinner),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [
      div({ style: { flex: 1, display: 'flex' } }, [
        div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [children]),
        workspace.workspace.state !== 'Deleting' &&
          workspace.workspace.state !== 'DeleteFailed' &&
          h(ContextBar, {
            workspace,
            apps,
            appDataDisks,
            refreshApps,
            runtimes,
            persistentDisks,
            refreshRuntimes,
            isLoadingCloudEnvironments,
            storageDetails,
          }),
      ]),
    ]),
    h(WorkspaceContainerModals, {
      workspace,
      refreshWorkspace,
      deletingWorkspace,
      setDeletingWorkspace,
      cloningWorkspace,
      setCloningWorkspace,
      leavingWorkspace,
      setLeavingWorkspace,
      sharingWorkspace,
      setSharingWorkspace,
      showLockWorkspaceModal,
      setShowLockWorkspaceModal,
      showSettingsModal,
      setShowSettingsModal,
    }),
  ]);
};

const WorkspaceAccessError = () => {
  const groupURL =
    'https://support.terra.bio/hc/en-us/articles/360024617851-Managing-access-to-shared-resources-data-and-tools-';
  return div({ style: { padding: '2rem', flexGrow: 1 } }, [
    h2(['Could not display workspace']),
    p(['You cannot access this workspace because it either does not exist or you do not have access to it. ']),
    h3(['Troubleshooting access:']),
    p([
      'You are currently logged in as ',
      span({ style: { fontWeight: 600 } }, [getTerraUser().email]),
      '. You may have access with a different account.',
    ]),
    p([
      'To view an existing workspace, the owner of the workspace must share it with you or with a ',
      h(Link, { ...Utils.newTabLinkProps, href: groupURL }, ['Group']),
      ' of which you are a member.',
    ]),
    p([azureControlledAccessRequestMessage]),
    h(
      ButtonPrimary,
      {
        href: Nav.getLink('workspaces'),
      },
      ['Return to Workspace List']
    ),
  ]);
};

export interface WrapWorkspaceOptions {
  breadcrumbs: (props: { name: string; namespace: string }) => ReactNode[];
  activeTab?: string;
  title: string | ((props: { name: string; namespace: string }) => string);
}

export interface WrappedComponentProps {
  ref: Ref<{ refresh: () => void }>;
  namespace: string;
  name: string;
  workspace: InitializedWorkspaceWrapper;
  refreshWorkspace: () => void;
  analysesData: AnalysesData;
  storageDetails: StorageDetails;
}

export type WrappedWorkspaceComponent = (props: WrappedComponentProps) => ReactNode;

export interface WorkspaceWrapperProps {
  namespace: string;
  name: string;
}

export type WorkspaceWrapperComponent = (props: WorkspaceWrapperProps) => ReactNode;

export type WrapWorkspaceFn = (WrappedComponent: WrappedWorkspaceComponent) => WorkspaceWrapperComponent;

/**
 * Wrap a component in the workspace-specific page UI (the main layout and workspace tabs).
 *
 * @returns A {@link https://legacy.reactjs.org/docs/higher-order-components.html higher order component} that
 * takes a component and wraps it with {@link WorkspaceContainer}. The returned wrapper component accepts a workspace
 * namespace and name as props. It loads information about the workspace and passes that information, along with
 * the namespace and name, to the wrapped component.
 */
export const wrapWorkspace = (opts: WrapWorkspaceOptions): WrapWorkspaceFn => {
  const { breadcrumbs, activeTab, title } = opts;
  return (WrappedComponent: WrappedWorkspaceComponent): WorkspaceWrapperComponent => {
    const Wrapper = (props: WorkspaceWrapperProps): ReactNode => {
      const { namespace, name } = props;
      const child = useRef<{ refresh: () => void } | null>(null);

      const { workspace, accessError, loadingWorkspace, storageDetails, refreshWorkspace } = useWorkspace(
        namespace,
        name
      );
      const { runtimes, refreshRuntimes, persistentDisks, appDataDisks, isLoadingCloudEnvironments } =
        useCloudEnvironmentPolling(name, namespace, workspace);
      const { apps, refreshApps, lastRefresh } = useAppPolling(name, namespace, workspace);

      return h(FooterWrapper, [
        h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
          div({ style: Style.breadcrumb.breadcrumb }, [
            div({ style: Style.noWrapEllipsis }, breadcrumbs(props)),
            h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [
              (_.isFunction(title) ? title(props) : title) || `${namespace}/${name}`,
            ]),
          ]),
        ]),
        loadingWorkspace && spinnerOverlay,
        accessError && h(WorkspaceAccessError),
        workspace &&
          h(
            WorkspaceContainer,
            {
              namespace,
              name,
              activeTab,
              workspace,
              refreshWorkspace,
              analysesData: {
                apps,
                refreshApps,
                lastRefresh,
                runtimes,
                refreshRuntimes,
                appDataDisks,
                persistentDisks,
                isLoadingCloudEnvironments,
              },
              storageDetails,
              refresh: async () => {
                await refreshWorkspace();
                if (_.isObject(child?.current) && 'refresh' in child.current && _.isFunction(child.current.refresh)) {
                  child.current.refresh();
                }
              },
            },
            [
              h(WrappedComponent, {
                ref: child,
                workspace,
                refreshWorkspace,
                analysesData: {
                  apps,
                  refreshApps,
                  lastRefresh,
                  runtimes,
                  refreshRuntimes,
                  appDataDisks,
                  persistentDisks,
                  isLoadingCloudEnvironments,
                },
                storageDetails,
                ...props,
              }),
            ]
          ),
      ]);
    };
    return withDisplayName('wrapWorkspace', Wrapper);
  };
};
