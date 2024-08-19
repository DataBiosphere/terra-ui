import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import { ReactNode, useState } from 'react';
import React from 'react';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';

export interface ExportToWorkspaceModalProps {
  methodNamespace: string;
  methodName: string;
  snapshotId: number;
  onDismiss: () => void;
}

/**
 * Modal for exporting a workflow from the Broad Methods Repo into a workspace.
 * @param {ExportToWorkspaceModalProps} props
 * @param {string} props.methodNamespace - the namespace of the method to be
 * exported
 * @param {string} props.methodName - the name of the method to be exported
 * @param {number} props.snapshotId - the ID of the method's snapshot that is to
 * be exported
 * @param {() => void} props.onDismiss - passed to the underlying modal
 */
export const ExportToWorkspaceModal = (props: ExportToWorkspaceModalProps): ReactNode => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { methodNamespace, methodName, snapshotId, onDismiss } = props;

  const [exportName, setExportName] = useState<string>(methodName);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | undefined>(undefined);

  const exportButton = (
    <ButtonPrimary
      disabled={!exportName || !selectedWorkspaceId}
      onClick={async () => {
        // ajax stuff
        // eslint-disable-next-line no-console
        console.log('export');
      }}
    >
      Export to Workspace
    </ButtonPrimary>
  );

  return (
    <Modal title={`Export ${methodNamespace}/${methodName} to Workspace`} onDismiss={onDismiss} okButton={exportButton}>
      <FormLabel>Workflow name</FormLabel>
      <TextInput label='Name' value={exportName} onChange={setExportName} />
      <FormLabel>Destination workspace</FormLabel>
      <WorkspaceSelector
        workspaces={[]}
        value={selectedWorkspaceId}
        onChange={setSelectedWorkspaceId}
        id='workspace-selector'
        aria-label='Select a workspace'
      />
    </Modal>
  );
};
