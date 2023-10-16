import _ from 'lodash/fp';
import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { generateAppName, getCurrentAppForUser } from 'src/analysis/utils/app-utils';
import { appAccessScopes, appToolLabels } from 'src/analysis/utils/tool-utils';
import { ButtonPrimary } from 'src/components/common';
import { styles as errorStyles } from 'src/components/ErrorView';
import { icon, spinner } from 'src/components/icons';
import { TextArea, TextInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import colors from 'src/libs/colors';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS } from 'src/libs/feature-previews-config';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { MethodVersion, WorkflowMethod } from 'src/workflows-app/components/WorkflowCard';
import { InputDefinition, OutputDefinition } from 'src/workflows-app/models/submission-models';
import { loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { convertArrayType } from 'src/workflows-app/utils/submission-utils';

type SubmitWorkflowModalProps = {
  method: WorkflowMethod;
  methodVersion: MethodVersion;
  recordType: string;
  selectedRecords: object;
  inputDefinition: InputDefinition[];
  outputDefinition: OutputDefinition[];
  callCachingEnabled: boolean;
  onDismiss: () => any;
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  apps: App[];
  refreshApps: () => Promise<void>;
};

export const SubmitWorkflowModal = ({
  method,
  methodVersion,
  recordType,
  selectedRecords,
  inputDefinition,
  outputDefinition,
  callCachingEnabled,
  onDismiss,
  name,
  namespace,
  apps,
  refreshApps,
  workspace,
  workspace: {
    workspace: { workspaceId, createdBy },
    canCompute,
  },
}: SubmitWorkflowModalProps) => {
  const [runSetName, setRunSetName] = useState(
    `${_.kebabCase(method.name)}_${_.kebabCase(recordType)}_${new Date().toISOString().slice(0, -5)}`
  );
  const [runSetDescription, setRunSetDescription] = useState('');
  const [isCreatingCromwellRunner, setIsCreatingCromwellRunner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStarted, setSubmitStarted] = useState(false);
  const [workflowSubmissionError, setWorkflowSubmissionError] = useState<string>();

  const { captureEvent } = useMetricsEvent();
  const cromwellRunner = getCurrentAppForUser(appToolLabels.CROMWELL_RUNNER_APP, apps);
  const cromwellRunnerLaunching = isCreatingCromwellRunner || cromwellRunner?.status === 'PROVISIONING';
  const cromwellRunnerNeeded =
    isFeaturePreviewEnabled(ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS) && cromwellRunner?.status !== 'RUNNING';
  const canSubmit =
    (isFeaturePreviewEnabled(ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS) && canCompute) ||
    getTerraUser().email === createdBy;

  const createCromwell = Utils.withBusyState(setIsCreatingCromwellRunner, async () => {
    try {
      await Ajax().Apps.createAppV2(
        generateAppName(),
        workspaceId,
        appToolLabels.CROMWELL_RUNNER_APP,
        appAccessScopes.USER_PRIVATE
      );
    } catch (error) {
      setWorkflowSubmissionError(JSON.stringify(error instanceof Response ? await error.json() : error, null, 2));
    }
    await refreshApps();
  });

  const submitRun = useCallback(async () => {
    try {
      const runSetsPayload = {
        run_set_name: runSetName,
        run_set_description: runSetDescription,
        method_version_id: methodVersion.method_version_id,
        workflow_input_definitions: _.map(convertArrayType, inputDefinition),
        workflow_output_definitions: outputDefinition,
        wds_records: {
          record_type: recordType,
          record_ids: _.keys(selectedRecords),
        },
        call_caching_enabled: callCachingEnabled,
      };
      const {
        cbasProxyUrlState: { state: cbasUrl },
      } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');
      const runSetObject = await Ajax().Cbas.runSets.post(cbasUrl, runSetsPayload);
      notify('success', 'Workflow successfully submitted', {
        message: 'You may check on the progress of workflow on this page anytime.',
        timeout: 5000,
      });
      captureEvent(Events.workflowsAppLaunchWorkflow, {
        ...extractWorkspaceDetails(workspace),
        methodUrl: methodVersion.url,
        methodVersion: methodVersion.name,
        methodSource: method.source,
        previouslyRun: method.last_run.previously_run,
      });
      Nav.goToPath('workspace-workflows-app-submission-details', {
        name,
        namespace,
        submissionId: runSetObject.run_set_id,
      });
    } catch (error) {
      setIsSubmitting(false);
      setSubmitStarted(false);
      setWorkflowSubmissionError(JSON.stringify(error instanceof Response ? await error.json() : error, null, 2));
    }
  }, [
    captureEvent,
    inputDefinition,
    outputDefinition,
    callCachingEnabled,
    method,
    name,
    namespace,
    runSetDescription,
    runSetName,
    methodVersion,
    recordType,
    selectedRecords,
    workspace,
    workspaceId,
  ]);

  useEffect(() => {
    if (isSubmitting && !submitStarted && !cromwellRunnerNeeded) {
      setSubmitStarted(true);
      submitRun();
    }
  }, [cromwellRunnerNeeded, isSubmitting, submitRun, submitStarted]);

  return h(
    Modal,
    {
      title: 'Send submission',
      width: 600,
      onDismiss: () => {
        if (!isSubmitting) {
          setWorkflowSubmissionError(undefined);
          onDismiss();
        }
      },
      showCancel: !isSubmitting,
      okButton: h(
        ButtonPrimary,
        {
          disabled: isSubmitting || !canSubmit,
          tooltip: !canSubmit && 'You do not have permission to submit workflows in this workspace',
          'aria-label': 'Launch Submission',
          onClick: async () => {
            setIsSubmitting(true);
            if (cromwellRunnerNeeded && !cromwellRunnerLaunching) {
              await createCromwell();
            }
          },
        },
        [isSubmitting ? 'Submitting...' : 'Submit']
      ),
    },
    [
      div({ style: { lineHeight: 2.0 } }, [
        h(TextCell, { style: { marginTop: '1.5rem', fontSize: 16, fontWeight: 'bold' } }, ['Submission name']),
        h(TextInput, {
          disabled: isSubmitting,
          'aria-label': 'Submission name',
          value: runSetName,
          onChange: setRunSetName,
          placeholder: 'Enter submission name',
        }),
      ]),
      div({ style: { lineHeight: 2.0, marginTop: '1.5rem' } }, [
        span({ style: { fontSize: 16, fontWeight: 'bold' } }, ['Comment ']),
        '(optional)',
        h(TextArea, {
          style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
          'aria-label': 'Enter a comment',
          disabled: isSubmitting,
          value: runSetDescription,
          onChange: setRunSetDescription,
          placeholder: 'Enter comments',
        }),
      ]),
      div({ style: { lineHeight: 2.0, marginTop: '1.5rem' } }, [
        div([
          h(TextCell, [
            'This will launch ',
            span({ style: { fontWeight: 'bold' } }, [_.keys(selectedRecords).length]),
            ' workflow(s).',
          ]),
        ]),
        h(TextCell, { style: { marginTop: '1rem' } }, ['Running workflows will generate cloud compute charges.']),
        workflowSubmissionError &&
          div([
            div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
              icon('warning-standard', { size: 16, style: { color: colors.danger() } }),
              h(TextCell, { style: { marginLeft: '0.5rem' } }, ['Error submitting workflow:']),
            ]),
            div(
              {
                style: { ...(errorStyles.jsonFrame as CSSProperties), overflowY: 'scroll', maxHeight: 160 },
                'aria-label': 'Modal submission error',
              },
              [workflowSubmissionError]
            ),
          ]),
        !canSubmit &&
          div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
            icon('warning-standard', { size: 16, style: { color: colors.danger() } }),
            h(TextCell, { style: { marginLeft: '0.5rem', marginRight: 'auto' } }, [
              'You do not have permission to run workflows in this workspace.',
            ]),
          ]),
        cromwellRunnerNeeded &&
          canSubmit &&
          !cromwellRunnerLaunching &&
          div([
            div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
              icon('info-circle', { size: 16, style: { color: colors.accent() } }),
              h(TextCell, { style: { margin: '0 0.5rem', textWrap: 'wrap', lineHeight: '1.15rem' } }, [
                'By clicking submit, Cromwell Runner will launch to run your workflow.',
              ]),
            ]),
          ]),
        cromwellRunnerLaunching &&
          div({ style: { display: 'flex', flexDirection: 'row', marginTop: '0.5rem' } }, [
            spinner(),
            div({ style: { marginLeft: '1rem' } }, ['Creating...']),
          ]),
      ]),
    ]
  );
};
