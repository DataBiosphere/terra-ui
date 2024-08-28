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
  exportButtonText: string;
  exportProvider: ExportWorkflowToWorkspaceProvider;
  onGoToExportedWorkflow?: (selectedWorkspace: WorkspaceInfo, workflowName: string) => void;
  onSuccess?: () => void;
  onDismiss: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

/**
 * A customizable component for exporting a particular workflow from any source
 * into an existing workspace.
 *
 * The component first displays the "main export modal," which allows the user
 * to choose a new name for the workflow in its new workspace, and optionally
 * allows them to select the destination workspace for the export. Once the
 * export is successfully completed, the component can optionally show a
 * "post-export modal" that allows the user to choose whether to go to the
 * location of the new exported workflow.
 *
 * @param {ExportWorkflowModalProps} props
 * @param {string} props.defaultWorkflowName - the string to be prefilled in the
 * workflow name input.
 * @param {WorkspaceInfo | ((workspace: WorkspaceWrapper) => boolean)} props.destinationWorkspace -
 * either a predetermined destination workspace into which the workflow will be
 * exported, in which case the destination workspace selector is not shown, or
 * a filter function for the destination workspace options, in which case the
 * selector is shown with options corresponding to all available workspaces
 * satisfying the filter condition.
 * @param {string} props.title - the title of the main export modal and the
 * post-export modal if shown.
 * @param {string} props.exportButtonText - the text shown on the main export
 * modal button.
 * @param {ExportWorkflowToWorkspaceProvider} props.exportProvider - provides
 * a function to make an API call to perform the export operation. The export
 * function provided is called with the predetermined or selected destination
 * workspace and the chosen workflow name when the user presses the main export
 * modal button.
 * @param {((selectedWorkspace: WorkspaceInfo, workflowName: string) => void) | undefined} props.onGoToExportedWorkflow -
 * the function to be called with the predetermined or selected destination
 * workspace and the chosen workflow name when the user presses the button in
 * the post-export modal to go to the exported workflow. Should navigate to the
 * new workflow. If undefined, the post-export modal will not be shown.
 * @param {(() => void) | undefined} props.onSuccess - if defined, called after
 * the user presses the main export modal button and the call to the export
 * provider's export function successfully resolves.
 * @param {(event: React.MouseEvent | React.KeyboardEvent) => void} props.onDismiss -
 * passed to the underlying Modal component for the main export modal and the
 * post-export modal if shown.
 */
const ExportWorkflowModal = (props: ExportWorkflowModalProps): ReactNode => {
  const {
    defaultWorkflowName,
    destinationWorkspace,
    title,
    exportButtonText,
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

  // if truthy, will be shown to the user in the ErrorView at the bottom of the
  // main export modal
  const [error, setError] = useState<any>(undefined);

  // whether the export operation is currently being performed and the spinner
  // should be shown
  const [exporting, setExporting] = useState<boolean>(false);

  // whether the export was successfully completed and the post-export modal
  // should be shown
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
        {exportButtonText}
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
