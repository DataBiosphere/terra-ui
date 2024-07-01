import { icon, Link, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash';
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { collapseStatus, statusType } from 'src/components/job-common';
import { Ajax } from 'src/libs/ajax';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus } from 'src/libs/state';
import { elements } from 'src/libs/style';
import { newTabLinkProps } from 'src/libs/utils';
import CallTable from 'src/pages/workspaces/workspace/jobHistory/CallTable';

import InputOutputModal from './components/InputOutputModal';
import { HeaderSection, SubmitNewWorkflowButton } from './components/job-common';
import { LogViewer } from './components/LogViewer';
import { WorkflowCostBox } from './components/WorkflowCostBox';
import { WorkflowInfoBox } from './components/WorkflowInfoBox';
import { loadAppUrls } from './utils/app-utils';
import { fetchCostMetadata, fetchWorkflowAndCallsMetadata, WorkflowMetadata } from './utils/cromwell-metadata-utils';
import { wrapWorkflowsPage } from './WorkflowsContainer';

type LogModalState = {
  showing: boolean;
  title: string;
  logsArray: any[];
  templateTesLog: string;
};

type TaskModalState = {
  showing: boolean;
  taskDataTile: string;
  taskDataJson: {};
};

type CromwellProxyUrlState =
  | { status: 'Ready'; state: string }
  | { status: 'None'; state: string }
  | { status: 'Error'; state: any };

export const CromwellPollInterval = 1000 * 30; // 30 seconds

export const BaseRunDetails = (
  {
    // Not using a 'props' type in order to conform with other things that use the workspace wrapper.
    name,
    namespace,
    workspace: {
      workspace: { workspaceId },
    },
    submissionId,
    workflowId,
  },
  _ref
): ReactNode => {
  const workspaceName: string | undefined = name;
  const workspaceBillingProject: string | undefined = namespace;

  /* State Setup */

  /* URL to talk to Cromwell. Must be retrieved from Leo, and is necessary for all Cromwell API calls. */
  const [cromwellProxyState, setCromwellProxyState] = useState<CromwellProxyUrlState>();
  const [workflowMetadata, setWorkflowMetadata] = useState<WorkflowMetadata>();
  const [callObjects, setCallObjects] = useState<any[] | undefined>([]);
  const [failedTasks, setFailedTasks] = useState<any[]>([]);
  const [logModalState, setLogModalState] = useState<LogModalState>({
    showing: false,
    title: '',
    logsArray: [],
    templateTesLog: '',
  });
  const [taskModalState, setTaskModalState] = useState<TaskModalState>({
    showing: false,
    taskDataTile: '',
    taskDataJson: {},
  });
  const [loadWorkflowFailed, setLoadWorkflowFailed] = useState(false);
  const signal = useCancellation();
  const stateRefreshTimer = useRef<NodeJS.Timeout>();
  const { captureEvent } = useMetricsEvent();

  const [sasToken, setSasToken] = useState('');

  const metadataArchiveStatus = useMemo(() => workflowMetadata?.metadataArchiveStatus, [workflowMetadata]);

  /* Callback for child components to use to open the log modal */
  const showLogModal = useCallback((modalTitle, logsArray, tesLog) => {
    setLogModalState({
      showing: true,
      title: modalTitle,
      logsArray,
      templateTesLog: tesLog,
    });
  }, []);

  /* Callback for child components to use to open the task data modal */
  const showTaskDataModal = useCallback((taskDataTitle, taskJson) => {
    setTaskModalState({
      showing: true,
      taskDataTile: taskDataTitle,
      taskDataJson: taskJson,
    });
  }, []);

  /* Data fetching */

  // Fetch the Cromwell App URL and status from Leo, exactly once, on load.
  useEffect(() => {
    const fetchCromwellProxyState = async () => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        setCromwellProxyState(cromwellProxyUrlState);
      } catch (error) {
        setLoadWorkflowFailed(true); // If we can't get the Cromwell URL, everything else will fail. Give up here.
        notify('error', 'Error fetching Cromwell proxy URL for workspace.', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    };
    fetchCromwellProxyState();
  });

  // Fetch the SAS token, exactly once, on load.
  useOnMount(() => {
    const fetchSasToken = async () => {
      try {
        const { sas } = await Ajax(signal).AzureStorage.details(workspaceId);
        setSasToken(sas.token);
      } catch (error) {
        notify('error', 'Error fetching SAS token for workspace.', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    };
    fetchSasToken();
  });

  // This fetch function is also passed to the CallTable component, so it can refresh this pages data when needed.
  const fetchWorkflowMetadata = useCallback(
    async (
      workflowId: string,
      cromwellProxyState: CromwellProxyUrlState,
      updateWorkflowPath: CallableFunction | undefined = undefined
    ) => {
      try {
        if (cromwellProxyState.status === AppProxyUrlStatus.Ready) {
          const metadata = await fetchWorkflowAndCallsMetadata({
            cromwellProxyUrl: cromwellProxyState?.state,
            signal,
            workflowId,
          });

          let failedTasks: any;
          if (metadata?.status?.toLocaleLowerCase() === 'failed') {
            try {
              failedTasks = await Ajax(signal).CromwellApp.workflows(workflowId).failedTasks(cromwellProxyState.state);
            } catch (error) {
              // do nothing, failure here means that user may not have access to an updated version of Cromwell
            }
          }

          // If the updateWorkflowPath function is not provided, we are in the RunDetailsPage and should update the state.
          _.isNil(updateWorkflowPath) && setWorkflowMetadata(metadata);

          if (!_.isEmpty(metadata?.calls)) {
            setFailedTasks((Object.values(failedTasks)[0] as { calls: any })?.calls || {});
            metadata.calls ? setCallObjects(metadata.calls) : setCallObjects(undefined);
            if (
              !_.isNil(metadata?.status) &&
              _.includes(collapseStatus(metadata?.status), [statusType.running, statusType.submitted])
            ) {
              stateRefreshTimer.current = setTimeout(() => {
                fetchWorkflowMetadata(workflowId, cromwellProxyState, updateWorkflowPath);
              }, 60000);
            }
          }
          const { workflowName } = metadata;
          !_.isNil(updateWorkflowPath) && updateWorkflowPath(workflowId, workflowName);
        }
      } catch (error) {
        notify('error', 'Error loading run details', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    },
    [signal, stateRefreshTimer]
  );

  // Fetch the workflow & calls metadata once the Cromwell URL is available.
  useEffect(() => {
    if (!cromwellProxyState || !cromwellProxyState.state || !workflowId) {
      return;
    }
    fetchWorkflowMetadata(workflowId, cromwellProxyState);
  }, [workflowId, cromwellProxyState, fetchWorkflowMetadata]);

  //  Below two methods are data fetchers used in the call cache wizard. Defined
  // here so we can easily use the cloud context (we're in Azure, which proxy URL.)
  const loadCallCacheDiff = useCallback(
    async (thisWorkflow, thatWorkflow) => {
      const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
      if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
        return Ajax(signal).CromwellApp.callCacheDiff(cromwellProxyUrlState.state, thisWorkflow, thatWorkflow);
      }
    },
    [signal, workspaceId]
  );

  const loadCallCacheMetadata = useCallback(
    async (wfId, includeKey, excludeKey) => {
      const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
      if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
        return Ajax(signal)
          .CromwellApp.workflows(wfId)
          .metadata(cromwellProxyUrlState.state, { includeKey, excludeKey });
      }
    },
    [signal, workspaceId]
  );

  // poll if we're missing CBAS proxy url and stop polling when we have it
  usePollingEffect(
    () => {
      if (cromwellProxyState && cromwellProxyState.state) {
        fetchWorkflowMetadata(workflowId, cromwellProxyState);
      }
      return Promise.resolve();
    },
    {
      ms: CromwellPollInterval,
      leading: false,
    }
  );

  /* render */
  const renderHeader = () => {
    if (
      !workspaceName ||
      !workspaceBillingProject ||
      !submissionId ||
      !workflowMetadata ||
      !workflowMetadata?.workflowName
    ) {
      return null;
    }
    const breadcrumbPathObjects = [
      {
        label: 'Submission History',
        path: 'workspace-workflows-app',
        pathParams: { workspaceName, workspaceBillingProject },
        queryParams: { tab: 'submission-history' },
      },
      {
        label: `Submission ${submissionId}`,
        path: 'workspace-workflows-app-submission-details',
        pathParams: { workspaceName, workspaceBillingProject, submissionId },
      },
      {
        label: workflowMetadata?.workflowName,
      },
    ];

    return h(HeaderSection, {
      breadcrumbPathObjects,
      button: h(SubmitNewWorkflowButton, { name: workspaceName, namespace: workspaceBillingProject || '' }),
      title: 'Workflow Details',
    });
  };

  const renderFailedState = () => {
    return h(Fragment, [
      span({ style: { fontStyle: 'italic', marginBottom: '1rem' } }, [
        'Failed to load workflow data. Please refresh and try again. If the problem persists, contact Terra Support for help',
      ]),
    ]);
  };

  const renderLoadingState = () => {
    return div({ style: { width: '100%' } }, [
      div({ style: { padding: '1rem 2rem 2rem' } }, [renderHeader()]),
      div({ style: { display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem 1rem' } }, [
        h(WorkflowInfoBox, {
          name: workspaceName,
          namespace: workspaceBillingProject,
          submissionId,
          workflowId,
          workspaceId,
          showLogModal,
        }),
      ]),
      div({ style: { marginTop: '125px' } }, [
        h(Spinner, { size: 48, style: { width: '100%', justifyContent: 'center' } }),
      ]),
    ]);
  };

  const renderArchivedAndDeletedState = () => {
    return h(Fragment, [
      div({ style: { lineHeight: '24px', marginTop: '0.5rem', ...elements.sectionHeader } }, [' Run Details Archived']),
      div({ style: { lineHeight: '24px', marginTop: '0.5rem' } }, [
        "This run's details have been archived. Please refer to the ",
        h(
          Link,
          {
            href: 'https://support.terra.bio/hc/en-us/articles/360060601631',
            ...newTabLinkProps,
          },
          [icon('pop-out', { size: 18 }), ' Run Details Archived']
        ),
        ' support article for details on how to access the archive.',
      ]),
    ]);
  };

  const renderSuccessfullyLoadedState = () => {
    return div({ style: { width: '100%' } }, [
      div({ style: { padding: '1rem 2rem 2rem' } }, [renderHeader()]),
      div({ style: { display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem 1rem' } }, [
        h(WorkflowInfoBox, {
          name: workspaceName,
          namespace: workspaceBillingProject || '',
          submissionId,
          workflowId,
          workspaceId,
          showLogModal,
        }),
      ]),
      h(WorkflowCostBox, { workflowId, signal, workspaceId, loadForSubworkflows: fetchCostMetadata }),
      div(
        {
          style: {
            margin: '2rem',
          },
        },
        [
          h(CallTable, {
            enableExplorer: workflowMetadata?.status?.toLocaleLowerCase() === 'succeeded',
            loadWorkflow: fetchWorkflowMetadata,
            loadCallCacheDiff,
            loadCallCacheMetadata,
            defaultFailedFilter: workflowMetadata?.status?.toLocaleLowerCase().includes('failed'),
            isRendered: !_.isEmpty(callObjects),
            showLogModal,
            showTaskDataModal,
            callObjects,
            failedTasks,
            workflowName: workflowMetadata?.workflowName,
            workflowId: workflowMetadata?.id,
            name: workspaceName,
            namespace: workspaceBillingProject || '',
            submissionId,
            isAzure: true,
            loadForSubworkflows: fetchCostMetadata,
          }),
        ]
      ),
      logModalState.showing &&
        h(LogViewer, {
          modalTitle: logModalState.title,
          logs: logModalState.logsArray,
          workspaceId,
          templateLogDirectory: logModalState.templateTesLog,
          onDismiss: () => {
            setLogModalState({ ...logModalState, showing: false });
            captureEvent(Events.workflowsAppCloseLogViewer);
          },
        }),
      taskModalState.showing &&
        h(InputOutputModal, {
          title: taskModalState.taskDataTile,
          jsonData: taskModalState.taskDataJson,
          onDismiss: () => setTaskModalState({ ...taskModalState, showing: false }),
          sasToken,
          workspaceId,
        }),
    ]);
  };
  if (loadWorkflowFailed) {
    return renderFailedState();
  }
  if (workflowMetadata === undefined) {
    return renderLoadingState();
  }
  if (metadataArchiveStatus === 'ArchivedAndDeleted') {
    return renderArchivedAndDeletedState();
  }
  return renderSuccessfullyLoadedState();
};

export const RunDetails = wrapWorkflowsPage({ name: 'RunDetails' })(BaseRunDetails);

export const navPaths = [
  {
    name: 'workspace-workflows-app-run-details',
    path: '/workspaces/:namespace/:name/workflows-app/submission-monitoring/:submissionId/:workflowId',
    component: RunDetails,
    title: ({ name }) => `${name} - Run Details`,
  },
];
