import { Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { PropsWithChildren, ReactNode, Ref, useEffect, useRef, useState } from 'react';
import { div, h, h2, h3, p, span } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import { WorkspaceAnalysesContainer } from 'src/analysis/WorkspaceAnalysesContainer';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import TitleBar from 'src/components/TitleBar';
import TopBar from 'src/components/TopBar';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { withDisplayName } from 'src/libs/react-utils';
import { getTerraUser, workspaceStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useSingleWorkspaceDeletionPolling } from 'src/workspaces/common/state/useDeletionPolling';
import { InitializedWorkspaceWrapper, StorageDetails, useWorkspace } from 'src/workspaces/common/state/useWorkspace';
import { WorkspaceDeletingBanner } from 'src/workspaces/container/WorkspaceDeletingBanner';
import { WorkspaceTabs } from 'src/workspaces/container/WorkspaceTabs';
import DeleteWorkspaceModal from 'src/workspaces/DeleteWorkspaceModal/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/workspaces/LockWorkspaceModal/LockWorkspaceModal';
import NewWorkspaceModal from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import ShareWorkspaceModal from 'src/workspaces/ShareWorkspaceModal/ShareWorkspaceModal';
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
  const warningMessage = ['Terra synchronizing permissions with Google. This may take a couple moments.'];

  return h(TitleBarSpinner, warningMessage);
};

interface WorkspaceContainerProps extends PropsWithChildren {
  namespace: string;
  name: string;
  breadcrumbs: ReactNode[];
  title: string;
  activeTab?: string;
  refresh: () => Promise<void>;
  workspace: InitializedWorkspaceWrapper | undefined;
  refreshWorkspace: () => void;
}

export const WorkspaceContainer = (props: WorkspaceContainerProps) => {
  const { namespace, name, breadcrumbs, title, activeTab, refresh, workspace, refreshWorkspace, children } = props;
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [cloningWorkspace, setCloningWorkspace] = useState(false);
  const [sharingWorkspace, setSharingWorkspace] = useState(false);
  const [showLockWorkspaceModal, setShowLockWorkspaceModal] = useState(false);
  const [leavingWorkspace, setLeavingWorkspace] = useState(false);
  const workspaceLoaded = !!workspace;
  const isGoogleWorkspaceSyncing =
    workspaceLoaded && isGoogleWorkspace(workspace) && workspace?.workspaceInitialized === false;

  useSingleWorkspaceDeletionPolling(workspace!);
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
    isGoogleWorkspaceSyncing && h(GooglePermissionsSpinner),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [children]),
    deletingWorkspace &&
      h(DeleteWorkspaceModal, {
        workspace: workspace!,
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
        samResourceId: workspace!.workspace.workspaceId,
        samResourceType: 'workspace',
        displayName: 'workspace',
        onDismiss: () => setLeavingWorkspace(false),
        onSuccess: () => Nav.goToPath('workspaces'),
      }),
    sharingWorkspace &&
      h(ShareWorkspaceModal, {
        workspace: workspace!,
        onDismiss: () => setSharingWorkspace(false),
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
  title: string;
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
          refresh: async () => {
            await refreshWorkspace();
            if (_.isObject(child?.current) && 'refresh' in child.current && _.isFunction(child.current.refresh)) {
              child.current.refresh();
            }
          },
        },
        [
          workspace &&
            h(
              WorkspaceAnalysesContainer,
              {
                workspace,
                storageDetails,
              },
              [
                (analysesData) =>
                  h(WrappedComponent, {
                    ref: child,
                    workspace,
                    refreshWorkspace,
                    analysesData,
                    storageDetails,
                    ...props,
                  }),
              ]
            ),
          loadingWorkspace && spinnerOverlay,
        ]
      );
    };
    return withDisplayName('wrapWorkspace', Wrapper);
  };
};
