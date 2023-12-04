import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import {
  ForwardedRef,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { div, h } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { Link } from 'src/components/common';
import { centeredSpinner } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { reportError, withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import { formatBytes, newTabLinkProps, withBusyState } from 'src/libs/utils';
import { canEditWorkspace, canWrite, isGoogleWorkspace, isOwner } from 'src/libs/workspace-utils';
import SignIn from 'src/pages/SignIn';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/pages/workspaces/hooks/useWorkspace';
import { CloudInformation } from 'src/pages/workspaces/workspace/Dashboard/CloudInformation';
import { DatasetAttributes } from 'src/pages/workspaces/workspace/Dashboard/DatasetAttributes';
import { OwnerNotice } from 'src/pages/workspaces/workspace/Dashboard/OwnerNotice';
import { RightBoxSection } from 'src/pages/workspaces/workspace/Dashboard/RightBoxSection';
import { WorkspaceDescription } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceDescription';
import { WorkspaceInformation } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceInformation';
import { WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceNotifications';
import { WorkspaceTags } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceTags';
import DashboardPublic from 'src/pages/workspaces/workspace/DashboardPublic';
import { WorkspaceAcl } from 'src/pages/workspaces/workspace/WorkspaceAcl';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

interface DashboardAuthContainerProps {
  namespace: string;
  name: string;
}

const DashboardAuthContainer = (props: DashboardAuthContainerProps): ReactNode => {
  const { namespace, name } = props;
  const { signInStatus } = useStore(authStore);
  const [featuredWorkspaces, setFeaturedWorkspaces] = useState<{ name: string; namespace: string }[]>();

  const isAuthInitialized = signInStatus !== 'uninitialized';

  useEffect(() => {
    const fetchData = async () => {
      setFeaturedWorkspaces(await Ajax().FirecloudBucket.getFeaturedWorkspaces());
    };
    if (signInStatus === 'signedOut') {
      fetchData();
    }
  }, [signInStatus]);

  const isFeaturedWorkspace = () => _.some((ws) => ws.namespace === namespace && ws.name === name, featuredWorkspaces);

  return cond(
    [
      !isAuthInitialized || (signInStatus === 'signedOut' && featuredWorkspaces === undefined),
      () => centeredSpinner({ style: { position: 'fixed' } }),
    ],
    [signInStatus === 'signedOut' && isFeaturedWorkspace(), () => h(DashboardPublic, props)],
    [signInStatus === 'signedOut', () => h(SignIn)],
    () => h(WorkspaceDashboardPage, props)
  );
};

interface WorkspaceDashboardProps {
  namespace: string;
  name: string;
  refreshWorkspace: () => void;
  storageDetails: StorageDetails;
  workspace: Workspace;
}

const WorkspaceDashboard = forwardRef((props: WorkspaceDashboardProps, ref: ForwardedRef<unknown>): ReactNode => {
  const {
    namespace,
    name,
    refreshWorkspace,
    storageDetails,
    workspace,
    workspace: {
      accessLevel,
      owners = [],
      workspace: { authorizationDomain, attributes = { description: '' } },
    },
  } = props;

  // State
  const [storageCost, setStorageCost] = useState<{ isSuccess: boolean; estimate: string; lastUpdated?: string }>();
  const [bucketSize, setBucketSize] = useState<{ isSuccess: boolean; usage: string; lastUpdated?: string }>();
  const [saving, setSaving] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [acl, setAcl] = useState<WorkspaceAcl>();

  const persistenceId = `workspaces/${namespace}/${name}/dashboard`;

  const signal = useCancellation();

  const refresh = () => {
    // If the current user is the only owner of the workspace, load the ACL to check if the workspace is shared.
    if (isOwner(accessLevel) && _.size(owners) === 1) {
      loadAcl();
    }
    updateGoogleBucketDetails(workspace);
  };

  const loadStorageCost = useMemo(
    () =>
      withErrorReporting('Error loading storage cost data', async () => {
        try {
          const { estimate, lastUpdated } = await Ajax(signal)
            .Workspaces.workspace(namespace, name)
            .storageCostEstimate();
          setStorageCost({ isSuccess: true, estimate, lastUpdated });
        } catch (error) {
          if (error instanceof Response && error.status === 404) {
            setStorageCost({ isSuccess: false, estimate: 'Not available' });
          } else {
            throw error;
          }
        }
      }),
    [namespace, name, signal]
  );

  const loadBucketSize = useMemo(
    () =>
      withErrorReporting('Error loading bucket size.', async () => {
        try {
          const { usageInBytes, lastUpdated } = await Ajax(signal).Workspaces.workspace(namespace, name).bucketUsage();
          setBucketSize({ isSuccess: true, usage: formatBytes(usageInBytes), lastUpdated });
        } catch (error) {
          if (error instanceof Response && error.status === 404) {
            setBucketSize({ isSuccess: false, usage: 'Not available' });
          } else {
            throw error;
          }
        }
      }),
    [namespace, name, signal]
  );

  const updateGoogleBucketDetails = useCallback(
    (workspace: Workspace) => {
      if (isGoogleWorkspace(workspace) && workspace.workspaceInitialized && canWrite(accessLevel)) {
        loadStorageCost();
        loadBucketSize();
      }
    },
    [accessLevel, loadStorageCost, loadBucketSize]
  );

  useEffect(() => {
    updateGoogleBucketDetails(workspace);
  }, [workspace, updateGoogleBucketDetails]);

  useImperativeHandle(ref, () => ({ refresh }));

  const loadAcl = withErrorReporting('Error loading ACL', async () => {
    const { acl } = await Ajax(signal).Workspaces.workspace(namespace, name).getAcl();
    setAcl(acl);
  });

  const saveDescription = withBusyState(setSaving, async (desc?: string): Promise<void> => {
    try {
      await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description: desc });
      refreshWorkspace();
    } catch (error) {
      reportError('Error saving workspace', error);
    }
  }) as (description?: string) => Promise<void>;

  // Lifecycle
  useOnMount(() => {
    refresh();
  });

  // Render

  // @ts-expect-error
  const { value: canEdit } = canEditWorkspace(workspace);

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: Style.dashboard.leftBox }, [
      h(WorkspaceDescription, {
        workspace,
        save: saveDescription,
        saving,
      }),
      h(DatasetAttributes, { attributes }),
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h(RightBoxSection, { title: 'Workspace information', persistenceId: `${persistenceId}/workspaceInfoPanelOpen` }, [
        h(WorkspaceInformation, { workspace }),
      ]),
      h(RightBoxSection, { title: 'Cloud information', persistenceId: `${persistenceId}/cloudInfoPanelOpen` }, [
        h(CloudInformation, { workspace, storageDetails, bucketSize, storageCost }),
      ]),
      h(
        RightBoxSection,
        {
          title: 'Owners',
          persistenceId: `${persistenceId}/ownersPanelOpen`,
          afterTitle: OwnerNotice({ acl, accessLevel, owners }),
        },
        [
          div(
            { style: { margin: '0.5rem' } },
            _.map((email) => {
              return div(
                { key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem' } },
                [h(Link, { href: `mailto:${email}` }, [email])]
              );
            }, owners)
          ),
        ]
      ),
      isGoogleWorkspace(workspace) &&
        !_.isEmpty(authorizationDomain) &&
        h(
          RightBoxSection,
          {
            title: 'Authorization domain',
            persistenceId: `${persistenceId}/authDomainPanelOpen`,
          },
          [
            div({ style: { margin: '0.5rem 0.5rem 1rem 0.5rem' } }, [
              'Collaborators must be a member of all of these ',
              h(
                Link,
                {
                  href: Nav.getLink('groups'),
                  ...newTabLinkProps,
                },
                ['groups']
              ),
              ' to access this workspace.',
            ]),
            ..._.map(
              ({ membersGroupName }) => div({ style: { margin: '0.5rem', fontWeight: 500 } }, [membersGroupName]),
              authorizationDomain
            ),
          ]
        ),
      h(WorkspaceTags, { name, namespace, workspace, canEdit, busy, setBusy }),
      h(
        RightBoxSection,
        {
          title: 'Notifications',
          persistenceId: `${persistenceId}/notificationsPanelOpen`,
        },
        [h(WorkspaceNotifications, { workspace })]
      ),
    ]),
  ]);
});

WorkspaceDashboard.displayName = 'WorkspaceDashboard';

const WorkspaceDashboardPage = wrapWorkspace({
  breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
  activeTab: 'dashboard',
  title: 'Dashboard',
})(WorkspaceDashboard);

export const navPaths = [
  {
    name: 'workspace-dashboard',
    path: '/workspaces/:namespace/:name',
    component: DashboardAuthContainer,
    title: ({ name }) => `${name} - Dashboard`,
    public: true,
  },
];
