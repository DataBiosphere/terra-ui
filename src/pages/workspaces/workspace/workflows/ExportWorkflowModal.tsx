import { Modal, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import ErrorView from 'src/components/ErrorView';
import { ValidatedInput } from 'src/components/input';
import { ExportWorkflowToWorkspaceProvider } from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import { workflowNameValidation } from 'src/libs/workflow-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';
import { WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';
import validate from 'validate.js';

export interface ExportWorkflowModalProps {
  defaultWorkflowName: string;
  destinationWorkspace: WorkspaceInfo | ((workspace: WorkspaceWrapper) => boolean);
  title: string;
  buttonText: string;
  exportProvider: ExportWorkflowToWorkspaceProvider;
  onGoToExportedWorkflow?: (selectedWorkspace: WorkspaceInfo, workflowName: string) => void;

  // now called regardless of the value of sameWorkspace, and only if defined
  onSuccess?: () => void;

  onDismiss: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

const ExportWorkflowModal = (props: ExportWorkflowModalProps): ReactNode => {
  const {
    defaultWorkflowName,
    destinationWorkspace,
    title,
    buttonText,
    exportProvider,
    onGoToExportedWorkflow,
    onSuccess,
    onDismiss,
  } = props;

  // true iff destinationWorkspace is WorkspaceInfo - a particular destination
  // workspace has been pre-set
  // false iff destinationWorkspace is a filter function - the user will be able
  // to select the destination workspace
  const presetDestination = typeof destinationWorkspace === 'object';

  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(
    presetDestination ? destinationWorkspace.workspaceId : undefined
  );
  const [workflowName, setWorkflowName] = useState<string>(defaultWorkflowName);
  const [error, setError] = useState<any>(undefined); // undefined/falsy = no error
  const [exporting, setExporting] = useState<boolean>(false);
  const [exported, setExported] = useState<boolean>(false);

  const { workspaces } = useWorkspaces();

  const destinationWorkspaceSelectorId = useUniqueId();
  const workflowNameInputId = useUniqueId();

  // Helpers
  const selectedWorkspace: WorkspaceInfo | undefined = _.find(
    { workspace: { workspaceId: selectedWorkspaceId } },
    workspaces
  )?.workspace;

  const doExport = async () => {
    if (selectedWorkspace === undefined) {
      setError('Cannot find destination workspace');
    } else {
      try {
        setExporting(true);
        await exportProvider.export(selectedWorkspace, workflowName);
        onSuccess?.();

        // If the post-export modal should be shown
        if (onGoToExportedWorkflow) {
          setExported(true);
        }
      } catch (error) {
        setError(error instanceof Response ? await error.text() : error);
        setExporting(false);
      }
    }
  };

  // Render helpers
  const renderExportForm = () => {
    const errors = validate(
      { selectedWorkspaceId, workflowName },
      {
        selectedWorkspaceId: { presence: true },
        workflowName: workflowNameValidation(),
      }
    );

    const okButton = (
      <ButtonPrimary tooltip={Utils.summarizeErrors(errors)} disabled={!!errors} onClick={doExport}>
        {buttonText}
      </ButtonPrimary>
    );

    return (
      <Modal title={title} onDismiss={onDismiss} okButton={okButton}>
        {!presetDestination && (
          <>
            <FormLabel htmlFor={destinationWorkspaceSelectorId} required>
              Destination
            </FormLabel>
            <WorkspaceSelector
              id={destinationWorkspaceSelectorId}
              workspaces={_.filter(destinationWorkspace, workspaces)}
              value={selectedWorkspaceId}
              onChange={setSelectedWorkspaceId}
              aria-label={undefined}
            />
          </>
        )}
        <FormLabel htmlFor={workflowNameInputId} required>
          Name
        </FormLabel>
        <ValidatedInput
          error={Utils.summarizeErrors(errors?.workflowName)}
          inputProps={{ id: workflowNameInputId, value: workflowName, onChange: setWorkflowName }}
        />
        {exporting && spinnerOverlay}
        {error && <ErrorView error={error} />}
      </Modal>
    );
  };

  const renderPostExport = () => {
    // Note: selectedWorkspace cannot be undefined because if it were, the
    // export would have failed and this modal would not be able to appear;
    // onGoToExportedWorkflow cannot be undefined because if it were,
    // exported could not have been set to true and this modal would not be
    // able to appear

    const okButton = (
      <ButtonPrimary onClick={() => onGoToExportedWorkflow!(selectedWorkspace!, workflowName)}>
        Go to exported workflow
      </ButtonPrimary>
    );

    return (
      <Modal title={title} onDismiss={onDismiss} cancelText='Stay Here' okButton={okButton}>
        Successfully exported <b>{workflowName}</b> to <b>{selectedWorkspace!.name}</b>. Do you want to view the
        exported workflow?
      </Modal>
    );
  };

  // Render
  return exported ? renderPostExport() : renderExportForm();
};

export default ExportWorkflowModal;
