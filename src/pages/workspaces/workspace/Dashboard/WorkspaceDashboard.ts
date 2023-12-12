import { Link } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { forwardRef, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import * as Style from 'src/libs/style';
import { canEditWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
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

export interface WorkspaceDashboardProps {
  namespace: string;
  name: string;
  refreshWorkspace: () => void;
  storageDetails: StorageDetails;
  workspace: Workspace;
}

export const WorkspaceDashboard = forwardRef(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (props: WorkspaceDashboardProps, ref: React.ForwardedRef<unknown>): ReactNode => {
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
        h(
          RightBoxSection,
          {
            title: 'Workspace information',
            persistenceId: `${persistenceId}/workspaceInfoPanelOpen`,
            defaultPanelOpen: true,
          },
          [h(WorkspaceInformation, { workspace })]
        ),
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
  }
);

WorkspaceDashboard.displayName = 'WorkspaceDashboard';
