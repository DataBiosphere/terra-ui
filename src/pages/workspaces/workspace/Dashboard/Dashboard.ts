import { Link } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { forwardRef, ReactNode, useEffect, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { centeredSpinner } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import { canEditWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
import SignIn from 'src/pages/SignIn';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/pages/workspaces/hooks/useWorkspace';
import { AuthDomainPanel } from 'src/pages/workspaces/workspace/Dashboard/AuthDomainPanel';
import { CloudInformation } from 'src/pages/workspaces/workspace/Dashboard/CloudInformation';
import { DatasetAttributes } from 'src/pages/workspaces/workspace/Dashboard/DatasetAttributes';
import { OwnerNotice } from 'src/pages/workspaces/workspace/Dashboard/OwnerNotice';
import { RightBoxSection } from 'src/pages/workspaces/workspace/Dashboard/RightBoxSection';
import { WorkspaceDescription } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceDescription';
import { WorkspaceInformation } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceInformation';
import { WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceNotifications';
import { WorkspaceTags } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceTags';
import DashboardPublic from 'src/pages/workspaces/workspace/DashboardPublic';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

interface DashboardAuthContainerProps {
  namespace: string;
  name: string;
}

export const DashboardAuthContainer = (props: DashboardAuthContainerProps): ReactNode => {
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

export const WorkspaceDashboard = forwardRef((props: WorkspaceDashboardProps): ReactNode => {
  const {
    namespace,
    name,
    refreshWorkspace,
    storageDetails,
    workspace,
    workspace: {
      owners = [],
      workspace: { authorizationDomain, attributes = { description: '' } },
    },
  } = props;

  const persistenceId = `workspaces/${namespace}/${name}/dashboard`;

  // @ts-expect-error
  const { value: canEdit } = canEditWorkspace(workspace);

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: Style.dashboard.leftBox }, [
      h(WorkspaceDescription, { workspace, refreshWorkspace }),
      h(DatasetAttributes, { attributes }),
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h(RightBoxSection, { title: 'Workspace information', persistenceId: `${persistenceId}/workspaceInfoPanelOpen` }, [
        h(WorkspaceInformation, { workspace }),
      ]),
      h(RightBoxSection, { title: 'Cloud information', persistenceId: `${persistenceId}/cloudInfoPanelOpen` }, [
        h(CloudInformation, { workspace, storageDetails }),
      ]),
      h(
        RightBoxSection,
        {
          title: 'Owners',
          persistenceId: `${persistenceId}/ownersPanelOpen`,
          afterTitle: OwnerNotice({ workspace }),
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
          [h(AuthDomainPanel, { workspace })]
        ),
      h(WorkspaceTags, { workspace, canEdit }),
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
