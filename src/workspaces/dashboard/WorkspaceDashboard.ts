import { Link } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { forwardRef, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import * as Style from 'src/libs/style';
import { InitializedWorkspaceWrapper as Workspace, StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { AuthDomainPanel } from 'src/workspaces/dashboard/AuthDomainPanel';
import { CloudInformation } from 'src/workspaces/dashboard/CloudInformation';
import { DatasetAttributes } from 'src/workspaces/dashboard/DatasetAttributes';
import { OwnerNotice } from 'src/workspaces/dashboard/OwnerNotice';
import { WorkspaceDescription } from 'src/workspaces/dashboard/WorkspaceDescription';
import { WorkspaceInformation } from 'src/workspaces/dashboard/WorkspaceInformation';
import { WorkspaceNotifications } from 'src/workspaces/dashboard/WorkspaceNotifications';
import { WorkspaceRightBoxSection } from 'src/workspaces/dashboard/WorkspaceRightBoxSection';
import { WorkspaceTags } from 'src/workspaces/dashboard/WorkspaceTags';
import { canEditWorkspace, isGoogleWorkspace } from 'src/workspaces/utils';

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

    return div(
      {
        style: {
          gridTemplateColumns: 'auto min-content',
          gridTemplateRows: 'auto 1fr',
          display: 'grid',
          minHeight: '100vh',
        },
      },
      [
        div({ style: Style.dashboard.leftBox }, [
          h(WorkspaceDescription, { workspace, refreshWorkspace }),
          h(DatasetAttributes, { attributes }),
        ]),
        div({ style: Style.dashboard.rightBox }, [
          h(
            WorkspaceRightBoxSection,
            {
              title: 'Workspace information',
              defaultPanelOpen: true,
              persistenceId: `${persistenceId}/workspaceInfoPanelOpen`,
              workspace,
            },
            [h(WorkspaceInformation, { workspace })]
          ),
          h(
            WorkspaceRightBoxSection,
            {
              title: 'Cloud information',
              persistenceId: `${persistenceId}/cloudInfoPanelOpen`,
              workspace,
            },
            [h(CloudInformation, { workspace, storageDetails })]
          ),
          h(
            WorkspaceRightBoxSection,
            {
              title: 'Owners',
              persistenceId: `${persistenceId}/ownersPanelOpen`,
              afterTitle: OwnerNotice({ workspace }),
              workspace,
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
              WorkspaceRightBoxSection,
              {
                title: 'Authorization domain',
                persistenceId: `${persistenceId}/authDomainPanelOpen`,
                workspace,
              },
              [h(AuthDomainPanel, { workspace })]
            ),
          h(WorkspaceTags, { workspace, canEdit }),
          h(
            WorkspaceRightBoxSection,
            {
              title: 'Notifications',
              persistenceId: `${persistenceId}/notificationsPanelOpen`,
              workspace,
            },
            [h(WorkspaceNotifications, { workspace })]
          ),
        ]),
        // "dummy" div to make background color below the right box sections the same if they do not
        // fill the full height of the dashboard
        div({ style: { ...Style.dashboard.rightBox, gridRow: '2', gridColumn: '2', padding: 0 } }, []),
      ]
    );
  }
);

WorkspaceDashboard.displayName = 'WorkspaceDashboard';
