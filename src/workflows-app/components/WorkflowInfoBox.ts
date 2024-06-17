import { useCallback, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { collapseStatus, makeStatusLine } from 'src/components/job-common';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { makeCompleteDate } from 'src/libs/utils';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';

import { loadAppUrls } from '../utils/app-utils';
import { fetchMetadata } from '../utils/submission-utils';
import { TroubleshootingBox } from './TroubleshootingBox';

interface WorkflowInfoBoxProps {
  name: string;
  namespace: string;
  submissionId: string;
  workflowId: string;
  workspaceId: string;
  showLogModal: (modalTitle: string, logsArray: string, tesLog: string) => void;
}

type FetchedWorkflowInfoData = {
  start: string;
  end?: string;
  wdlScript?: string;
  status: string;
  workflowLog: string;
};

export const WorkflowInfoBox: React.FC<WorkflowInfoBoxProps> = (props) => {
  const signal = useCancellation();
  const [workflowInfo, setWorkflowInfo] = useState<FetchedWorkflowInfoData | undefined>(undefined);

  const loadWorkflowMetadata = useCallback(
    async (workflowId: string) => {
      const { cromwellProxyUrlState } = await loadAppUrls(props.workspaceId, 'cromwellProxyUrlState');
      const metadata = await fetchMetadata({
        cromwellProxyUrl: cromwellProxyUrlState.state,
        workflowId,
        signal,
        includeKeys: ['start', 'end', 'submittedFiles', 'status', 'workflowLog'],
        excludeKeys: ['calls'], // NB: Calls can be very large, so it's important for performance to exclude them from the web request (in this component)
      });
      const data: FetchedWorkflowInfoData = {
        start: metadata.start,
        end: metadata.end,
        wdlScript: metadata.submittedFiles.workflow,
        status: metadata.status,
        workflowLog: metadata.workflowLog,
      };
      setWorkflowInfo(data);
    },
    [props.workspaceId, signal]
  );

  useOnMount(() => {
    const load = async () => {
      try {
        await Promise.all([loadWorkflowMetadata(workflowId)]);
      } catch (e) {
        // TODO: Fail even more gracefully
        // eslint-disable-next-line no-console
        console.log(e);
      }
    };
    load();
  });

  const workflowStart: string = workflowInfo?.start ? makeCompleteDate(workflowInfo.start) : 'N/A';
  const workflowEnd: string = workflowInfo?.end ? makeCompleteDate(workflowInfo.end) : 'N/A';
  const workflowScript: string = workflowInfo?.wdlScript ? workflowInfo.wdlScript : 'N/A';
  const status: string = workflowInfo?.status ? workflowInfo.status : 'Unknown';

  const name: string = props.name;
  const namespace: string = props.namespace;
  const logUri: string = workflowInfo?.workflowLog ? workflowInfo.workflowLog : 'N/A';
  const submissionId: string = props.submissionId;
  const workflowId: string = props.workflowId;

  const appIdMatched = 'appIdMatched'; // TODO: This is WRONG and should be something like setAppIdMatched(stdOut && stdOut !== null ? stdOut.match('terra-app-[0-9a-fA-f-]*') : null);
  const workflowName = 'workflowName'; // TODO: This is WRONG and should be something like:
  /*
  const getWorkflowName = () => {
    return appIdMatched
      ? stdOut
          .substring(appIdMatched.index + appIdMatched[0].length + 1)
          .substring(0, stdOut.substring(appIdMatched.index + appIdMatched[0].length + 1).indexOf('/'))
      : null;
  };
  */
  const [showWDLModal, setShowWDLModal] = useState(false);

  return div(
    {
      style: {
        paddingTop: '0.25em',
        paddingBottom: '0.25em',
        lineHeight: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        margin: '0 10px',
      },
    },
    [
      div([
        div({}, [span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Timing:'])]),
        div({}, [
          div({ 'aria-label': 'Workflow Start Container' }, [
            span({ style: { fontWeight: 'bold' } }, ['Start: ']),
            span({}, [workflowStart]),
          ]),
          div({ 'aria-label': 'Workflow End Container' }, [
            span({ style: { fontWeight: 'bold' } }, ['End: ']),
            span({}, [workflowEnd]),
          ]),
        ]),
      ]),
      div({ 'aria-label': 'Workflow Status Container' }, [
        div({}, [span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Status:'])]),
        div({}, [
          div({ style: { lineHeight: '24px', marginTop: '0.5rem' } }, [
            makeStatusLine((style) => collapseStatus(status).icon(style), status),
          ]),
        ]),
      ]),
      div([
        div({}, [span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Script:'])]),
        div({}, [
          h(
            Link,
            {
              onClick: () => {
                setShowWDLModal(true);
              },
            },
            [icon('fileAlt', { size: 18 }), ' View Workflow Script']
          ),
        ]),
      ]),
      div({ 'aria-label': 'Troubleshooting Box' }, [
        h(TroubleshootingBox, {
          name,
          namespace,
          logUri,
          submissionId,
          workflowId,
          showLogModal: props.showLogModal,
          appId: appIdMatched,
          workflowName,
        }),
      ]),
      showWDLModal && h(ViewWorkflowScriptModal, { workflowScript, onDismiss: () => setShowWDLModal(false) }),
    ]
  );
};
