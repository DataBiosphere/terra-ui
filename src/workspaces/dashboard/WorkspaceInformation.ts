import { InfoBox, Link } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { dl, h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';
import { InfoRow } from 'src/workspaces/dashboard/InfoRow';
import { getPolicyDescriptions } from 'src/workspaces/utils';

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
  const workspaceUrl = `${window.location.origin}/#workspaces/${workspace.workspace.workspaceId}`;

  return dl([
    h(InfoRow, { title: 'Last Updated' }, [new Date(workspace.workspace.lastModified).toLocaleDateString()]),
    h(InfoRow, { title: 'Creation Date' }, [new Date(workspace.workspace.createdDate).toLocaleDateString()]),
    h(InfoRow, { title: 'Access Level' }, [roleString[workspace.accessLevel]]),
    _.map((policyDescription) => {
      return h(
        InfoRow,
        { key: policyDescription.shortDescription, title: _.startCase(policyDescription.shortDescription) },
        [
          'Yes',
          !!policyDescription.longDescription &&
            h(InfoBox, { style: { marginLeft: '1ch' }, side: 'bottom' }, [policyDescription.longDescription]),
        ]
      );
    }, policyDescriptions),
    h(InfoRow, { title: h(Link, { href: workspaceUrl }, ['Permalink to this workspace']) }, [
      h(ClipboardButton, { 'aria-label': 'Copy Permalink to this workspace to clipboard', text: workspaceUrl }),
    ]),
  ]);
};
