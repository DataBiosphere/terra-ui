import _ from 'lodash/fp';
import {
  ComponentPropsWithRef,
  Dispatch,
  Fragment,
  JSXElementConstructor,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { br, div, h, h2, p, span } from 'react-hyperscript-helpers';
import { ContextBar } from 'src/analysis/ContextBar';
import { analysisTabName } from 'src/analysis/runtime-common-components';
import RuntimeManager from 'src/analysis/RuntimeManager';
import { getDiskAppType } from 'src/analysis/utils/app-utils';
import { getConvertedRuntimeStatus, getCurrentRuntime } from 'src/analysis/utils/runtime-utils';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon, spinner } from 'src/components/icons';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { TabBar } from 'src/components/tabBars';
import TitleBar from 'src/components/TitleBar';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { isTerra } from 'src/libs/brand-utils';
import colors from 'src/libs/colors';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import { getTerraUser } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import {
  hasProtectedData,
  isAzureWorkspace,
  isGoogleWorkspace,
  isOwner,
  protectedDataMessage,
  regionConstraintMessage,
  WorkspaceWrapper,
} from 'src/libs/workspace-utils';
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import {
  InitializedWorkspaceWrapper as Workspace,
  StorageDetails,
  useWorkspace,
} from 'src/pages/workspaces/workspace/useWorkspace';
import WorkspaceAttributeNotice from 'src/pages/workspaces/workspace/WorkspaceAttributeNotice';
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu';

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
  });
};

const TitleBarSpinner = (props: PropsWithChildren): ReactNode => {
  return h(TitleBar, {
    title: div({ role: 'alert', style: { display: 'flex', alignItems: 'center' } }, [
      spinner({
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

interface WorkspaceTabsProps {
  namespace?: string;
  name?: string;
  workspace?: WorkspaceWrapper;
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
    namespace,
    name,
    workspace,
    activeTab,
    refresh,
    setDeletingWorkspace,
    setCloningWorkspace,
    setSharingWorkspace,
    setShowLockWorkspaceModal,
    setLeavingWorkspace,
  } = props;
  const wsOwner = workspace && isOwner(workspace.accessLevel);
  const canShare = workspace?.canShare;
  const isLocked = !!workspace?.workspace.isLocked;
  const workspaceLoaded = !!workspace;
  const googleWorkspace = workspaceLoaded && isGoogleWorkspace(workspace);
  const azureWorkspace = workspaceLoaded && isAzureWorkspace(workspace);

  const onClone = () => setCloningWorkspace(true);
  const onDelete = () => setDeletingWorkspace(true);
  const onLock = () => setShowLockWorkspaceModal(true);
  const onShare = () => setSharingWorkspace(true);
  const onLeave = () => setLeavingWorkspace(true);

  const tabs = [
    { name: 'dashboard', link: 'workspace-dashboard' },
    { name: 'data', link: 'workspace-data' },
    { name: 'analyses', link: analysisTabName },
    ...(googleWorkspace
      ? [
          { name: 'workflows', link: 'workspace-workflows' },
          { name: 'job history', link: 'workspace-job-history' },
        ]
      : []),
    ...(azureWorkspace ? [{ name: 'workflows', link: 'workspace-workflows-app' }] : []),
  ];
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
          // @ts-expect-error
          workspaceInfo: { canShare, isLocked, isOwner: wsOwner, workspaceLoaded },
        }),
      ]
    ),
  ]);
};

interface WorkspaceContainerProps {
  namespace?: string;
  name?: string;
  breadcrumbs: ReactNode;
  title: string;
  activeTab?: string;
  analysesData: AppDetails & CloudEnvironmentDetails;
  storageDetails: StorageDetails;
  refresh: () => Promise<unknown>;
  workspace: Workspace;
  refreshWorkspace: () => void;
}

export const WorkspaceContainer = (props: PropsWithChildren<WorkspaceContainerProps>) => {
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

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({ style: Style.noWrapEllipsis }, [breadcrumbs]),
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
    workspaceLoaded && isAzureWorkspace(workspace) && h(AzureWarning),
    isGoogleWorkspaceSyncing && h(GooglePermissionsSpinner),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [
      div({ style: { flex: 1, display: 'flex' } }, [
        div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [children]),
        workspace &&
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

interface CloudEnvironmentDetails {
  runtimes?: ListRuntimeItem[];
  refreshRuntimes: (maybeStale?: boolean) => Promise<unknown>;
  persistentDisks?: PersistentDisk[];
  appDataDisks?: PersistentDisk[];
}

const useCloudEnvironmentPolling = (workspace: Workspace): CloudEnvironmentDetails => {
  const signal = useCancellation();
  const timeout = useRef<NodeJS.Timeout>();
  const [runtimes, setRuntimes] = useState<ListRuntimeItem[]>();
  const [persistentDisks, setPersistentDisks] = useState<PersistentDisk[]>();
  const [appDataDisks, setAppDataDisks] = useState<PersistentDisk[]>();

  const saturnWorkspaceNamespace = workspace?.workspace.namespace;
  const saturnWorkspaceName = workspace?.workspace.name;

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshRuntimesSilently, ms);
  };
  const load = async (maybeStale) => {
    try {
      const cloudEnvFilters = _.pickBy((l) => !_.isUndefined(l), {
        role: 'creator',
        saturnWorkspaceName,
        saturnWorkspaceNamespace,
      });

      // Disks.list API takes includeLabels to specify which labels to return in the response
      // Runtimes.listV2 API always returns all labels for a runtime
      const [newDisks, newRuntimes] = workspace
        ? await Promise.all([
            Ajax(signal)
              .Disks.disksV1()
              .list({
                ...cloudEnvFilters,
                includeLabels: 'saturnApplication,saturnWorkspaceName,saturnWorkspaceNamespace',
              }),
            Ajax(signal).Runtimes.listV2(cloudEnvFilters),
          ])
        : [[], []];

      setRuntimes(newRuntimes);
      setAppDataDisks(_.remove((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      setPersistentDisks(_.filter((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      const runtime = getCurrentRuntime(newRuntimes);
      reschedule(
        maybeStale ||
          ['Creating', 'Starting', 'Stopping', 'Updating', 'LeoReconfiguring'].includes(
            getConvertedRuntimeStatus(runtime) ?? ''
          )
          ? 10000
          : 120000
      );
    } catch (error) {
      reschedule(30000);
      throw error;
    }
  };
  const refreshRuntimes = withErrorReporting('Error loading cloud environments', load);
  const refreshRuntimesSilently = withErrorIgnoring(load);
  useOnMount(() => {
    refreshRuntimes();
    return () => clearTimeout(timeout.current);
  });
  return { runtimes, refreshRuntimes, persistentDisks, appDataDisks };
};

interface AppDetails {
  apps?: ListAppResponse[];
  refreshApps: (maybeStale?: boolean) => Promise<unknown>;
}

const useAppPolling = (workspace: Workspace): AppDetails => {
  const signal = useCancellation();
  const timeout = useRef<NodeJS.Timeout>();
  const [apps, setApps] = useState<ListAppResponse[]>();

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshAppsSilently, ms);
  };
  const loadApps = async (maybeStale) => {
    try {
      const newGoogleApps =
        !!workspace && isGoogleWorkspace(workspace)
          ? await Ajax(signal).Apps.list(workspace.workspace.googleProject, {
              role: 'creator',
              saturnWorkspaceName: workspace.workspace.name,
            })
          : [];
      const newAzureApps =
        !!workspace && isAzureWorkspace(workspace)
          ? await Ajax(signal).Apps.listAppsV2(workspace.workspace.workspaceId, { role: 'creator' })
          : [];
      const combinedNewApps = [...newGoogleApps, ...newAzureApps];

      setApps(combinedNewApps);
      Object.values(combinedNewApps).forEach((app) => {
        reschedule(maybeStale || (app && ['PROVISIONING', 'PREDELETING'].includes(app.status)) ? 10000 : 120000);
      });
    } catch (error) {
      reschedule(30000);
      throw error;
    }
  };
  const refreshApps = withErrorReporting('Error loading apps', loadApps);
  const refreshAppsSilently = withErrorIgnoring(loadApps);
  useOnMount(() => {
    refreshApps();
    return () => clearTimeout(timeout.current);
  });
  return { apps, refreshApps };
};

interface WrapWorkspaceProps {
  breadcrumbs: (props: { name: string; namespace: string }) => ReactNode;
  activeTab?: string;
  title: string;
}

interface WrappedComponentProps extends ComponentPropsWithRef<any> {
  workspace: Workspace;
  refreshWorkspace: () => void;
  analysesData: AppDetails & CloudEnvironmentDetails;
  storageDetails: StorageDetails;
}

export const wrapWorkspace =
  ({ breadcrumbs, activeTab, title }: WrapWorkspaceProps) =>
  <T extends WrappedComponentProps>(WrappedComponent: JSXElementConstructor<T>) => {
    const Wrapper = (props) => {
      const { namespace, name } = props;
      const child = useRef<unknown>();

      const { workspace, accessError, loadingWorkspace, storageDetails, refreshWorkspace } = useWorkspace(
        namespace,
        name
      );
      const { runtimes, refreshRuntimes, persistentDisks, appDataDisks } = useCloudEnvironmentPolling(workspace);
      const { apps, refreshApps } = useAppPolling(workspace);

      // The following is necessary to support the context bar properly loading runtimes for google/azure
      useEffect(() => {
        refreshRuntimes(true);
        refreshApps(true);
      }, [workspace]); // eslint-disable-line react-hooks/exhaustive-deps

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
            if (
              !!child?.current &&
              typeof child.current === 'object' &&
              'refresh' in child.current &&
              child.current.refresh instanceof Function
            ) {
              child.current.refresh();
            }
          },
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
