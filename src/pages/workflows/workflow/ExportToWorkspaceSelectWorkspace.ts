import { ButtonPrimary, Modal, Select } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { TextInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { useCancellation } from 'src/libs/react-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';
import { canWrite, isGoogleWorkspace } from 'src/workspaces/utils';

export interface ExportToWorkspaceSelectWorkspaceProps {
  methodNamespace: string;
  methodName: string;
  snapshotId: number;
  onDismiss: () => void;
}

export const ExportToWorkspaceSelectWorkspace = (props: ExportToWorkspaceSelectWorkspaceProps): ReactNode => {
  const { onDismiss } = props;
  const signal = useCancellation();

  const { methodNamespace, methodName, snapshotId } = props;

  const [exportName, setExportName] = useState(methodName);
  const [rootEntityType, setRootEntityType] = useState('');

  const { workspaces, loading } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(undefined);

  const exportButton = h(
    ButtonPrimary,
    {
      disabled: !selectedWorkspaceId || !exportName || !rootEntityType,
      onClick: async () => {
        const template = await Ajax(signal).Methods.template({
          methodNamespace,
          methodName,
          methodVersion: snapshotId,
        });
        const completedTemplate = {
          ...template,
          name: exportName,
          namespace: methodNamespace,
          rootEntityType,
        };
        const selectedWorkspace = _.find((ws) => ws.workspace.workspaceId === selectedWorkspaceId, workspaces);

        await Ajax(signal)
          .Methods.method(methodNamespace, methodName, snapshotId)
          .toWorkspaceFromTemplate(selectedWorkspace.workspace, completedTemplate);

        Nav.goToPath('workflow', {
          namespace: selectedWorkspace.workspace.namespace,
          name: selectedWorkspace.workspace.name,
          workflowNamespace: methodNamespace,
          workflowName: exportName,
        });
      },
    },
    ['Export to Workspace']
  );

  return h(
    Modal,
    {
      title: `Export ${methodNamespace}/${methodName} to Workspace`,
      onDismiss,
      okButton: exportButton,
    },
    [
      div({ style: { display: 'flex', flexDirection: 'column', gap: '1rem' } }, [
        h(FormLabel, ['Name']),
        h(TextInput, { label: 'Name', value: exportName, onChange: setExportName }),
        h(FormLabel, ['Root Entity Type']),
        h(Select, {
          value: rootEntityType,
          isSearchable: false,
          options: ['participant', 'sample', 'pair'],
          onChange: ({ value }) => setRootEntityType(value),
        }),
        h(FormLabel, ['Workspace']),
        loading
          ? 'Loading workspaces list'
          : h(WorkspaceSelector, {
              workspaces: _.filter((ws) => {
                return canWrite(ws.accessLevel) && isGoogleWorkspace(ws);
              }, workspaces),
              value: selectedWorkspaceId,
              onChange: (id) => {
                setSelectedWorkspaceId(id);
              },
              id: 'workspace-selector',
              'aria-label': 'Select a workspace',
            }),
      ]),
    ]
  );
};
