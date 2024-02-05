import _ from 'lodash/fp';
import { Fragment, ReactElement, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { withDisplayName } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { withWorkspaces } from 'src/workspaces/common/state/withWorkspaces';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';
import NewWorkspaceModal from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import { canWrite, WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';

type WorkspaceImporterProps = {
  additionalErrors: any;
  authorizationDomain?: string;
  selectedWorkspaceId?: string;
  onImport: (workspace: WorkspaceInfo) => void;
};

type WorkspaceImporterInnerProps = WorkspaceImporterProps & {
  workspaces: WorkspaceWrapper[];
  loadingWorkspaces: boolean;
  refreshWorkspaces: () => void;
};

// Type WorkspaceImporter because types don't carry through flow.
export const WorkspaceImporter: (props: WorkspaceImporterInnerProps) => ReactElement<any, any> = _.flow(
  withDisplayName('WorkspaceImporter'),
  withWorkspaces
)(
  ({
    workspaces,
    loadingWorkspaces,
    refreshWorkspaces,
    onImport,
    authorizationDomain: ad,
    selectedWorkspaceId: initialWs,
    additionalErrors,
    ...props
  }: WorkspaceImporterInnerProps) => {
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWs);
    const [creatingWorkspace, setCreatingWorkspace] = useState(false);

    const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces);

    return h(Fragment, [
      // @ts-expect-error
      h(WorkspaceSelector, {
        workspaces: _.filter((ws) => {
          return (
            canWrite(ws.accessLevel) && (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
          );
        }, workspaces),
        noOptionsMessage: loadingWorkspaces ? _.constant('Loading workspaces') : undefined,
        value: selectedWorkspaceId,
        onChange: setSelectedWorkspaceId,
        ...props,
      }),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(
          ButtonPrimary,
          {
            disabled: !selectedWorkspace || additionalErrors,
            tooltip: Utils.cond<ReactNode>(
              [!selectedWorkspace, () => 'Select valid a workspace to import'],
              [additionalErrors, () => Utils.summarizeErrors(additionalErrors)],
              () => 'Import workflow to workspace'
            ),
            onClick: () => {
              // Since this button is disabled when selectedWorkspace is falsy,
              // we can safely assert that it's non-null when the button is clicked.
              onImport(selectedWorkspace!.workspace);
            },
          },
          ['Import']
        ),
        div({ style: { marginLeft: '1rem', whiteSpace: 'pre' } }, ['Or ']),
        h(
          Link,
          {
            disabled: additionalErrors,
            onClick: () => setCreatingWorkspace(true),
          },
          ['create a new workspace']
        ),
      ]),
      creatingWorkspace &&
        h(NewWorkspaceModal, {
          requiredAuthDomain: ad,
          workflowImport: true,
          onDismiss: () => setCreatingWorkspace(false),
          onSuccess: (w) => {
            setCreatingWorkspace(false);
            setSelectedWorkspaceId(w.workspaceId);
            refreshWorkspaces();
            onImport(w);
          },
        }),
    ]);
  }
);
