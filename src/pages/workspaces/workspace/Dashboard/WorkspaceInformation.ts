import { InfoBox } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { dl, h } from 'react-hyperscript-helpers';
import { getPolicyDescriptions } from 'src/libs/workspace-utils';
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
  const policyDescriptions = getPolicyDescriptions(workspace);

  return dl([
    h(InfoRow, { title: 'Last Updated' }, [new Date(workspace.workspace.lastModified).toLocaleDateString()]),
    h(InfoRow, { title: 'Creation Date' }, [new Date(workspace.workspace.createdDate).toLocaleDateString()]),
    h(InfoRow, { title: 'Access Level' }, [roleString[workspace.accessLevel]]),
    _.map((policyDescription) => {
      return h(
        InfoRow,
        { key: policyDescription.shortDescription, title: _.startCase(policyDescription.shortDescription) },
        ['Yes', h(InfoBox, { style: { marginLeft: '0.50rem' }, side: 'bottom' }, [policyDescription.longDescription])]
      );
    }, policyDescriptions),
  ]);
};
