import { Modal, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { ButtonPrimary, spinnerOverlay } from 'src/components/common';
import ErrorView from 'src/components/ErrorView';
import { ValidatedInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import { FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import { workflowNameValidation } from 'src/libs/workflow-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';
import * as WorkspaceUtils from 'src/workspaces/utils';
import { WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';
import validate from 'validate.js';

export interface ExportWorkflowModalProps {
  thisWorkspace: WorkspaceInfo;
  sameWorkspace?: boolean;

  // TODO: confirmed MethodConfiguration from Rawls, contingent on StateHistory issue, but some fields missing - see
  //  Ajax(signal).Workspaces.workspace(namespace, name).listMethodConfigs(); and
  //  Ajax(signal).Workspaces.workspace(namespace, name).methodConfig(workflowNamespace, workflowName).get();
  methodConfig: any;

  // now called regardless of the value of sameWorkspace, and only if defined
  onSuccess?: () => void;

  onDismiss: (event: React.MouseEvent | React.KeyboardEvent) => void;
}

const ExportWorkflowModal = (props: ExportWorkflowModalProps): ReactNode => {
  const { thisWorkspace, sameWorkspace = false, methodConfig, onSuccess, onDismiss } = props;

  // State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(
    sameWorkspace ? thisWorkspace.workspaceId : undefined
  );
  const [workflowName, setWorkflowName] = useState<string>(`${methodConfig.name}${sameWorkspace ? '_copy' : ''}`);
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
    try {
      setExporting(true);
      await Ajax()
        .Workspaces.workspace(thisWorkspace.namespace, thisWorkspace.name)
        .methodConfig(methodConfig.namespace, methodConfig.name)
        .copyTo({
          destConfigNamespace: selectedWorkspace!.namespace,
          destConfigName: workflowName,
          workspaceName: {
            namespace: selectedWorkspace!.namespace,
            name: selectedWorkspace!.name,
          },
        });
      onSuccess?.();
      if (!sameWorkspace) {
        setExported(true);
      }
    } catch (error) {
      setError(error instanceof Response ? await error.text() : error);
      setExporting(false);
    }
  };

  const filteredWorkspaces: WorkspaceWrapper[] = _.filter(({ workspace: { workspaceId }, accessLevel }) => {
    return thisWorkspace.workspaceId !== workspaceId && WorkspaceUtils.canWrite(accessLevel);
  }, workspaces);

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
        Copy
      </ButtonPrimary>
    );

    return (
      <Modal
        title={sameWorkspace ? 'Duplicate Workflow' : 'Copy to Workspace'}
        onDismiss={onDismiss}
        okButton={okButton}
      >
        {!sameWorkspace && (
          <>
            <FormLabel htmlFor={destinationWorkspaceSelectorId} required>
              Destination
            </FormLabel>
            <WorkspaceSelector
              id={destinationWorkspaceSelectorId}
              workspaces={filteredWorkspaces}
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
    const okButton = (
      <ButtonPrimary
        onClick={() =>
          Nav.goToPath('workflow', {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name,
            workflowNamespace: selectedWorkspace.namespace,
            workflowName,
          })
        }
      >
        Go to exported workflow
      </ButtonPrimary>
    );

    return (
      <Modal title='Copy to Workspace' onDismiss={onDismiss} cancelText='Stay Here' okButton={okButton}>
        Successfully exported <b>{workflowName}</b> to <b>{selectedWorkspace.name}</b>. Do you want to view the exported
        workflow?
      </Modal>
    );
  };

  // Render
  return exported ? renderPostExport() : renderExportForm();
};

export default ExportWorkflowModal;
