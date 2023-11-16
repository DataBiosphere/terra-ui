import { ReactNode } from 'react';
import { dl, h } from 'react-hyperscript-helpers';
import { InfoBox } from 'src/components/InfoBox';
import {
  dataAccessControlsMessage,
  hasDataAccessControls,
  hasProtectedData,
  hasRegionConstraint,
  protectedDataMessage,
  regionConstraintMessage,
} from 'src/libs/workspace-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';
import { InfoRow } from 'src/pages/workspaces/workspace/Dashboard/InfoRow';

const roleString = {
  READER: 'Reader',
  WRITER: 'Writer',
  OWNER: 'Owner',
  PROJECT_OWNER: 'Project Owner',
};

interface WorkspaceInformationProps {
  workspace: Workspace;
}
export const WorkspaceInformation = (props: WorkspaceInformationProps): ReactNode => {
  const { workspace } = props;
  return dl([
    h(InfoRow, { title: 'Last Updated' }, [new Date(workspace.workspace.lastModified).toLocaleDateString()]),
    h(InfoRow, { title: 'Creation Date' }, [new Date(workspace.workspace.createdDate).toLocaleDateString()]),
    h(InfoRow, { title: 'Access Level' }, [roleString[workspace.accessLevel]]),
    hasProtectedData(workspace) &&
      h(InfoRow, { title: 'Workspace Protected' }, [
        'Yes',
        h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [protectedDataMessage]),
      ]),
    hasRegionConstraint(workspace) &&
      h(InfoRow, { title: 'Region Constraint' }, [
        'Yes',
        h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [regionConstraintMessage(workspace)]),
      ]),
    hasDataAccessControls(workspace) &&
      h(InfoRow, { title: 'Data Access Controls' }, [
        'Yes',
        h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [dataAccessControlsMessage(workspace)]),
      ]),
  ]);
};
