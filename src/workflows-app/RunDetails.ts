import { icon, Link, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash';
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { collapseStatus, statusType } from 'src/components/job-common';
import { Ajax } from 'src/libs/ajax';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation, usePollingEffect } from 'src/libs/react-utils';
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
import {
  calculateCostOfCallsArray,
  fetchCostMetadata,
  fetchWorkflowAndCallsMetadata,
  WorkflowMetadata,
} from './utils/cromwell-metadata-utils';
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

// Conforms to the WrapWorfklowsPage function
interface RunDetailsProps {
  name?: string;
  namespace?: string;
  workspace?: {
    workspace: {
      workspaceId: string;
    };
  };
  submissionId?: string;
  workflowId?: string;
}

export const BaseRunDetails = (props: RunDetailsProps, _ref): ReactNode => {
  const workspaceName = props.name;
  const workspaceBillingProject = props.namespace;
  const workspaceId = props?.workspace?.workspace.workspaceId;
  const { submissionId, workflowId } = props;

  /* State Setup */

  /* Leo app state of Cromwell, which includes both the app status and the app URL.
   Must be retrieved from Leo, and is necessary for all Cromwell API calls.
   Cached here so we only fetch it once. */
  const [cromwellProxyState, setCromwellProxyState] = useState<CromwellProxyUrlState>();

  /* Workflow metadta, which includes the call objects array, among other things. 
  The web request to fetch this data may be slow. */
  const [workflowMetadata, setWorkflowMetadata] = useState<WorkflowMetadata>();
  const [callObjects, setCallObjects] = useState<any[] | undefined>([]);

  const [costMetadata, setCostMetadata] = useState<WorkflowMetadata>();
  const [rootWorkflowCost, setRootWorkflowCost] = useState<number>();
  /* If a workflow fails, we make a special request to get the failed tasks. */
  const [failedTasks, setFailedTasks] = useState<any[]>([]);

  /* Modal states. Child components are given a callback to open these modals. */
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

  /* State to track if the workflow failed to load. */
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

  // Fetch the Cromwell App URL and status from Leo.
  useEffect(() => {
    const fetchCromwellProxyState = async () => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        setCromwellProxyState(cromwellProxyUrlState);
      } catch (error) {
        notify('error', 'Error fetching Cromwell proxy URL for workspace.', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    };
    fetchCromwellProxyState();
  }, [workspaceId]);

  // Fetch the SAS token on load.
  useEffect(() => {
    if (!workspaceId) return;
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
  }, [signal, workspaceId]);

  // This fetch function is also passed to the CallTable component, so it can refresh this page's data when needed.
  const fetchWorkflowMetadata = useCallback(
    async (workflowId: string, updateWorkflowPath: CallableFunction | undefined = undefined) => {
      if (!cromwellProxyState || !cromwellProxyState.state || !workflowId) {
        return;
      }
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
              console.error('Error loading failed tasks', error);
              // do nothing, failure here means that user may not have access to an updated version of Cromwell
            }
          }

          // If the updateWorkflowPath function is not provided, we are in the RunDetailsPage and should update the state.
          _.isNil(updateWorkflowPath) && setWorkflowMetadata(metadata);

          if (!_.isEmpty(metadata?.calls)) {
            setCallObjects(metadata.calls);
          }
          if (!_.isEmpty(metadata?.calls) && !_.isEmpty(failedTasks)) {
            setFailedTasks((Object.values(failedTasks)[0] as { calls: any })?.calls || {});
            metadata.calls ? setCallObjects(metadata.calls) : setCallObjects(undefined);
            if (
              !_.isNil(metadata?.status) &&
              _.includes(collapseStatus(metadata?.status), [statusType.running, statusType.submitted])
            ) {
              stateRefreshTimer.current = setTimeout(() => {
                fetchWorkflowMetadata(workflowId, updateWorkflowPath);
              }, 60000);
            }
          }
          const { workflowName } = metadata;
          !_.isNil(updateWorkflowPath) && updateWorkflowPath(workflowId, workflowName);
        }
      } catch (error) {
        setLoadWorkflowFailed(true);
        notify('error', 'Error loading run details', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    },
    [signal, stateRefreshTimer, cromwellProxyState]
  );

  // Fetch the workflow & calls metadata once the Cromwell URL is available.
  useEffect(() => {
    if (!cromwellProxyState || !cromwellProxyState.state || !workflowId) {
      return;
    }
    fetchWorkflowMetadata(workflowId);
  }, [workflowId, cromwellProxyState, fetchWorkflowMetadata]);

  // Fetch the cost data for the workflow and all of its subworkflows.
  useEffect(() => {
    if (!cromwellProxyState || !cromwellProxyState.state || !workflowId) {
      return;
    }
    const makeCostMetadataRequest = async () => {
      const costMetadata = await fetchCostMetadata({ cromwellProxyUrl: cromwellProxyState.state, signal, workflowId });
      setCostMetadata(costMetadata);
      setRootWorkflowCost(calculateCostOfCallsArray(costMetadata.calls));
    };
    makeCostMetadataRequest();
  }, [cromwellProxyState, signal, workflowId]);

  // Given a call name (e.g. )
  const getCostOfCallFn = useCallback(
    (callName: string): number | undefined => {
      if (!costMetadata || !costMetadata.calls) {
        console.error('Cannot fetch call cost without cost metadata');
        return undefined;
      }

      for (const callKey of Object.keys(costMetadata.calls)) {
        if (callKey === callName) {
          return calculateCostOfCallsArray(costMetadata.calls[callKey].calls);
        }
      }
      return 79.99;
    },
    [costMetadata]
  );

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

  // poll if we're missing Cromwell proxy url and stop polling when we have it
  usePollingEffect(
    () => {
      if (cromwellProxyState && cromwellProxyState.state && workflowId) {
        fetchWorkflowMetadata(workflowId);
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
    const breadcrumbPathObjects = [
      {
        label: 'Submission History',
        path: 'workspace-workflows-app',
        pathParams: { name: workspaceName, namespace: workspaceBillingProject },
        queryParams: { tab: 'submission-history' },
      },
      {
        label: `Submission ${submissionId}`,
        path: 'workspace-workflows-app-submission-details',
        pathParams: { name: workspaceName, namespace: workspaceBillingProject, submissionId },
      },
      {
        label: workflowMetadata?.workflowName,
      },
    ];

    return h(HeaderSection, {
      breadcrumbPathObjects,
      button: h(SubmitNewWorkflowButton, { name: workspaceName, namespace: workspaceBillingProject }),
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
    if (!workspaceName || !workspaceBillingProject || !submissionId || !workflowId || !workspaceId) {
      return div({ style: { marginTop: '125px' } }, [
        h(Spinner, { size: 48, style: { width: '100%', justifyContent: 'center' } }),
      ]);
    }
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
    if (
      !workspaceName ||
      !workspaceBillingProject ||
      !submissionId ||
      !workspaceId ||
      !workflowId ||
      !workflowMetadata ||
      !callObjects
    ) {
      return null;
    }
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
      h(WorkflowCostBox, { workflowCost: rootWorkflowCost, workflowStatus: workflowMetadata?.status }),
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
            namespace: workspaceBillingProject,
            submissionId,
            isAzure: true,
            getCostOfCallFn,
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
