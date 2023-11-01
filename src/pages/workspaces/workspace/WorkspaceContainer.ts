import { Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ComponentPropsWithRef, PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import { br, div, h, h2, p, span } from 'react-hyperscript-helpers';
import { ContextBar } from 'src/analysis/ContextBar';
import RuntimeManager from 'src/analysis/RuntimeManager';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon } from 'src/components/icons';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import TitleBar from 'src/components/TitleBar';
import TopBar from 'src/components/TopBar';
import { isTerra } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { ErrorCallback } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { withDisplayName } from 'src/libs/react-utils';
import { getTerraUser, workspaceStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { isAzureWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
import { AppDetails, useAppPolling } from 'src/pages/workspaces/hooks/useAppPolling';
import {
  CloudEnvironmentDetails,
  useCloudEnvironmentPolling,
} from 'src/pages/workspaces/hooks/useCloudEnvironmentPolling';
import { useSingleWorkspaceDeletetionPolling } from 'src/pages/workspaces/hooks/useDeletionPolling';
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import {
  InitializedWorkspaceWrapper as Workspace,
  StorageDetails,
  useWorkspace,
} from 'src/pages/workspaces/workspace/useWorkspace';
import { WorkspaceDeletingBanner } from 'src/pages/workspaces/workspace/WorkspaceDeletingBanner';
import { WorkspaceTabs } from 'src/pages/workspaces/workspace/WorkspaceTabs';

const TitleBarWarning = (props: PropsWithChildren): ReactNode => {
  return h(TitleBar, {
    title: div(
      {
        role: 'alert',
        style: { display: 'flex', alignItems: 'center', margin: '1rem' },
      },
      [
        icon('warning-standard', { size: 32, style: { color: colors.danger(), marginRight: '0.5rem' } }),
        span({ style: { color: colors.dark(), fontSize: 14 } }, [props.children]),
      ]
    ),
    style: { backgroundColor: colors.accent(0.35), borderBottom: `1px solid ${colors.accent()}` },
    onDismiss: () => {},
    hideCloseButton: true,
  });
};

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

const AzureWarning = (): ReactNode => {
  const warningMessage = [
    'Do not store Unclassified Confidential Information in this platform, as it violates US Federal Policy (ie FISMA, FIPS-199, etc) unless explicitly authorized by the dataset manager or governed by your own agreements.',
  ];
  return h(TitleBarWarning, warningMessage);
};

const GooglePermissionsSpinner = (): ReactNode => {
  const warningMessage = ['Terra synchronizing permissions with Google. This may take a couple moments.'];

  return h(TitleBarSpinner, warningMessage);
};

interface WorkspaceContainerProps extends PropsWithChildren {
  namespace: string;
  name: string;
  breadcrumbs: ReactNode[];
  title: string;
  activeTab?: string;
  analysesData: AppDetails & CloudEnvironmentDetails;
  storageDetails: StorageDetails;
  refresh: () => Promise<void>;
  workspace: Workspace;
  refreshWorkspace: () => void;
  silentlyRefreshWorkspace: (errorHandling?: ErrorCallback) => Promise<void>;
}

export const WorkspaceContainer = (props: WorkspaceContainerProps) => {
  const {
    namespace,
    name,
    breadcrumbs,
    title,
    activeTab,
    analysesData: { apps = [], refreshApps, runtimes = [], refreshRuntimes, appDataDisks = [], persistentDisks = [] },
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
  const workspaceLoaded = !!workspace;
  const isGoogleWorkspaceSyncing =
    workspaceLoaded && isGoogleWorkspace(workspace) && workspace?.workspaceInitialized === false;

  useSingleWorkspaceDeletetionPolling(workspace);
  useEffect(() => {
    if (workspace?.workspace?.state === 'Deleted') {
      Nav.goToPath('workspaces');
      workspaceStore.reset();
    }
  }, [workspace]);

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({ style: Style.noWrapEllipsis }, breadcrumbs),
        h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [title || `${namespace}/${name}`]),
      ]),
      div({ style: { flexGrow: 1 } }),
      isTerra() &&
        h(
          Link,
          {
            href: 'https://support.terra.bio/hc/en-us/articles/360041068771--COVID-19-workspaces-data-and-tools-in-Terra',
            style: {
              backgroundColor: colors.light(),
              borderRadius: 4,
              margin: '0 0.5rem',
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            },
            ...Utils.newTabLinkProps,
          },
          [
            icon('virus', { size: 24, style: { marginRight: '0.5rem' } }),
            div({ style: { fontSize: 12, color: colors.dark() } }, ['COVID-19', br(), 'Data & Tools']),
          ]
        ),
      h(RuntimeManager, { namespace, name, runtimes, apps }),
    ]),
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
    }),
    h(WorkspaceDeletingBanner, { workspace }),
    workspaceLoaded && isAzureWorkspace(workspace) && h(AzureWarning),
    isGoogleWorkspaceSyncing && h(GooglePermissionsSpinner),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [
      div({ style: { flex: 1, display: 'flex' } }, [
        div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [children]),
        workspace &&
          workspace?.workspace.state !== 'Deleting' &&
          workspace?.workspace.state !== 'DeleteFailed' &&
          h(ContextBar, {
            workspace,
            apps,
            appDataDisks,
            refreshApps,
            runtimes,
            persistentDisks,
            refreshRuntimes,
            storageDetails,
          }),
      ]),
    ]),
    deletingWorkspace &&
      h(DeleteWorkspaceModal, {
        workspace,
        onDismiss: () => setDeletingWorkspace(false),
        onSuccess: () => Nav.goToPath('workspaces'),
      }),
    cloningWorkspace &&
      h(NewWorkspaceModal, {
        cloneWorkspace: workspace,
        onDismiss: () => setCloningWorkspace(false),
        onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name }),
      }),
    showLockWorkspaceModal &&
      h(LockWorkspaceModal, {
        // @ts-expect-error
        workspace,
        onDismiss: () => setShowLockWorkspaceModal(false),
        onSuccess: () => refreshWorkspace(),
      }),
    leavingWorkspace &&
      h(LeaveResourceModal, {
        samResourceId: workspace.workspace.workspaceId,
        samResourceType: 'workspace',
        displayName: 'workspace',
        onDismiss: () => setLeavingWorkspace(false),
        onSuccess: () => Nav.goToPath('workspaces'),
      }),
    sharingWorkspace &&
      h(ShareWorkspaceModal, {
        workspace,
        onDismiss: () => setSharingWorkspace(false),
      }),
  ]);
};

const WorkspaceAccessError = () => {
  const groupURL =
    'https://support.terra.bio/hc/en-us/articles/360024617851-Managing-access-to-shared-resources-data-and-tools-';
  const authorizationURL =
    'https://support.terra.bio/hc/en-us/articles/360026775691-Managing-access-to-controlled-data-with-Authorization-Domains';
  return div({ style: { padding: '2rem', flexGrow: 1 } }, [
    h2(['Could not display workspace']),
    p(['You are trying to access a workspace that either does not exist, or you do not have access to it.']),
    p([
      'You are currently logged in as ',
      span({ style: { fontWeight: 600 } }, [getTerraUser().email]),
      '. You may have access with a different account.',
    ]),
    p([
      'To view an existing workspace, the owner of the workspace must share it with you or with a ',
      h(Link, { ...Utils.newTabLinkProps, href: groupURL }, ['Group']),
      ' of which you are a member. ',
      'If the workspace is protected under an ',
      h(Link, { ...Utils.newTabLinkProps, href: authorizationURL }, ['Authorization Domain']),
      ', you must be a member of every group within the Authorization Domain.',
    ]),
    p(['If you think the workspace exists but you do not have access, please contact the workspace owner.']),
    h(
      ButtonPrimary,
      {
        href: Nav.getLink('workspaces'),
      },
      ['Return to Workspace List']
    ),
  ]);
};

interface WrapWorkspaceProps {
  breadcrumbs: (props: { name: string; namespace: string }) => ReactNode[];
  activeTab?: string;
  title: string;
}

interface WrappedComponentProps extends ComponentPropsWithRef<any> {
  workspace: Workspace;
  refreshWorkspace: () => void;
  analysesData: AppDetails & CloudEnvironmentDetails;
  storageDetails: StorageDetails;
}

type WrappedWorkspaceComponent<T extends WrappedComponentProps> = (props: T) => ReactNode;

type WorkspaceWrapperFunction<T extends WrappedComponentProps> = (
  component: WrappedWorkspaceComponent<T>
) => WrappedWorkspaceComponent<T>;

/**
 * wrapWorkspaces contains a component in the WorkspaceContainer
 * and provides the workspace analysesData and storageDetails
 * */
export const wrapWorkspace = <T extends WrappedComponentProps>(
  props: WrapWorkspaceProps
): WorkspaceWrapperFunction<T> => {
  const { breadcrumbs, activeTab, title } = props;
  return (WrappedComponent: WrappedWorkspaceComponent<T>): WrappedWorkspaceComponent<T> => {
    const Wrapper = (props) => {
      const { namespace, name } = props;
      const child = useRef<unknown>();

      const { workspace, accessError, loadingWorkspace, storageDetails, refreshWorkspace, silentlyRefreshWorkspace } =
        useWorkspace(namespace, name);
      const { runtimes, refreshRuntimes, persistentDisks, appDataDisks } = useCloudEnvironmentPolling(workspace);
      const { apps, refreshApps } = useAppPolling(workspace);

      if (accessError) {
        return h(FooterWrapper, [h(TopBar), h(WorkspaceAccessError)]);
      }

      return h(
        WorkspaceContainer,
        {
          namespace,
          name,
          activeTab,
          workspace,
          refreshWorkspace,
          title: _.isFunction(title) ? title(props) : title,
          breadcrumbs: breadcrumbs(props),
          analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks },
          storageDetails,
          refresh: async () => {
            await refreshWorkspace();
            if (_.isObject(child?.current) && 'refresh' in child.current && _.isFunction(child.current.refresh)) {
              child.current.refresh();
            }
          },
          silentlyRefreshWorkspace,
        },
        [
          workspace &&
            h(WrappedComponent, {
              ref: child,
              workspace,
              refreshWorkspace,
              analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks },
              storageDetails,
              ...props,
            }),
          loadingWorkspace && spinnerOverlay,
        ]
      );
    };
    return withDisplayName('wrapWorkspace', Wrapper);
  };
};
