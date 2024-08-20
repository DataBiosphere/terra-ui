import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { Fragment, ReactNode, useState } from 'react';
import { b, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common';
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
import { WorkspaceInfo } from 'src/workspaces/utils';
import validate from 'validate.js';

export interface ExportWorkflowModalProps {
  thisWorkspace: WorkspaceInfo;
  sameWorkspace?: boolean;

  // TODO: confirmed MethodConfiguration from Rawls, contingent on StateHistory issue, but some fields missing - see
  //  Ajax(signal).Workspaces.workspace(namespace, name).listMethodConfigs(); and
  //  Ajax(signal).Workspaces.workspace(namespace, name).methodConfig(workflowNamespace, workflowName).get();
  methodConfig: any;

  // TODO: if sameWorkspace is true, onSuccess is required
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
  const [error, setError] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exported, setExported] = useState<boolean>(false);

  const { workspaces } = useWorkspaces();

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
          destConfigNamespace: selectedWorkspace.namespace,
          destConfigName: workflowName,
          workspaceName: {
            namespace: selectedWorkspace.namespace,
            name: selectedWorkspace.name,
          },
        });
      if (sameWorkspace) {
        onSuccess();
      } else {
        setExported(true);
      }
    } catch (error) {
      // TODO: this will fail for errors from withCancellation (see fetch-core.ts) - assumes Response type
      //  (such as if selectedWorkspace is undefined)
      setError(await error.text());
      setExporting(false);
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

    return h(
      Modal,
      {
        title: sameWorkspace ? 'Duplicate Workflow' : 'Copy to Workspace',
        onDismiss,
        okButton: h(
          ButtonPrimary,
          {
            tooltip: Utils.summarizeErrors(errors),
            disabled: !!errors,
            onClick: doExport,
          },
          ['Copy']
        ),
      },
      [
        !sameWorkspace &&
          h(IdContainer, [
            (id) =>
              h(Fragment, [
                h(FormLabel, { htmlFor: id, required: true }, ['Destination']),
                h(WorkspaceSelector, {
                  id,
                  workspaces: _.filter(({ workspace: { workspaceId }, accessLevel }) => {
                    return thisWorkspace.workspaceId !== workspaceId && WorkspaceUtils.canWrite(accessLevel);
                  }, workspaces),
                  value: selectedWorkspaceId,
                  onChange: setSelectedWorkspaceId,
                }),
              ]),
          ]),
        h(IdContainer, [
          (id) =>
            h(Fragment, [
              h(FormLabel, { htmlFor: id, required: true }, ['Name']),
              h(ValidatedInput, {
                error: Utils.summarizeErrors(errors?.workflowName),
                inputProps: {
                  id,
                  value: workflowName,
                  onChange: setWorkflowName,
                },
              }),
            ]),
        ]),
        exporting && spinnerOverlay,
        error && h(ErrorView, { error }),
      ]
    );
  };

  const renderPostExport = () => {
    return h(
      Modal,
      {
        title: 'Copy to Workspace',
        onDismiss,
        cancelText: 'Stay Here',
        okButton: h(
          ButtonPrimary,
          {
            onClick: () =>
              Nav.goToPath('workflow', {
                namespace: selectedWorkspace.namespace,
                name: selectedWorkspace.name,
                workflowNamespace: selectedWorkspace.namespace,
                workflowName,
              }),
          },
          ['Go to exported workflow']
        ),
      },
      [
        'Successfully exported ',
        b([workflowName]),
        ' to ',
        b([selectedWorkspace.name]),
        '. Do you want to view the exported workflow?',
      ]
    );
  };

  // Render
  return exported ? renderPostExport() : renderExportForm();
};

export default ExportWorkflowModal;
