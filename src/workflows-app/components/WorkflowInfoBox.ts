import { ReactNode, useCallback, useState } from 'react';
import { dd, div, dl, dt, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { collapseStatus, makeStatusLine } from 'src/components/job-common';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { makeCompleteDate } from 'src/libs/utils';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';
import { fetchMetadata } from 'src/workflows-app/utils/cromwell-metadata-utils';

import { loadAppUrls } from '../utils/app-utils';
import { TroubleshootingBox } from './TroubleshootingBox';

export interface WorkflowInfoBoxProps {
  name: string;
  namespace: string;
  submissionId: string;
  workflowId: string;
  workspaceId: string;
  showLogModal: (modalTitle: string, logsArray: any[], tesLog: string) => void;
}

interface FetchedWorkflowInfoData {
  start?: string;
  end?: string;
  wdlScript?: string;
  status?: string;
  workflowLog?: string;
  executionDirectory?: string;
}

export const WorkflowInfoBox = (props: WorkflowInfoBoxProps): ReactNode => {
  const { name, namespace, submissionId, workflowId, showLogModal } = props;
  const signal = useCancellation();
  const [workflowInfo, setWorkflowInfo] = useState<FetchedWorkflowInfoData>();

  const loadWorkflowMetadata = useCallback(
    async (workflowId: string) => {
      const { cromwellProxyUrlState } = await loadAppUrls(props.workspaceId, 'cromwellProxyUrlState');
      const metadata = await fetchMetadata({
        cromwellProxyUrl: cromwellProxyUrlState.state,
        workflowId,
        signal,
        includeKeys: ['start', 'end', 'submittedFiles', 'status', 'workflowLog', 'workflowRoot'],
        excludeKeys: ['calls'], // NB: Calls can be very large, so it's important for performance to exclude them from the web request (in this component)
        expandSubWorkflows: false,
      });
      const data: FetchedWorkflowInfoData = {
        start: metadata.start,
        end: metadata.end,
        wdlScript: metadata?.submittedFiles?.workflow,
        status: metadata.status,
        workflowLog: metadata.workflowLog,
        executionDirectory: metadata.workflowRoot,
      };
      setWorkflowInfo(data);
    },
    [props.workspaceId, signal]
  );

  useOnMount(() => {
    const load = async () => {
      try {
        await loadWorkflowMetadata(workflowId);
      } catch (error) {
        notify('error', 'Failed to fetch workflow metadata', {
          detail: error instanceof Response ? await error.text() : error,
        });
        console.error('Failed to fetch workflow metadata', error);
      }
    };
    load();
  });

  const workflowStart: string = workflowInfo?.start ? makeCompleteDate(workflowInfo.start) : 'N/A';
  const workflowEnd: string = workflowInfo?.end ? makeCompleteDate(workflowInfo.end) : 'N/A';
  const workflowScript: string = workflowInfo?.wdlScript ? workflowInfo.wdlScript : 'N/A';
  const status: string = workflowInfo?.status ? workflowInfo.status : 'Unknown';
  const logUri: string = workflowInfo?.workflowLog ? workflowInfo.workflowLog : 'N/A';

  const [showWDLModal, setShowWDLModal] = useState(false);

  if (!workflowInfo) {
    return null; // Could consider rendering a loading spinner here, but I think that looks worse b/c the page already has other spinners and this component loads pretty quickly.
  }

  const ddStyle = { marginLeft: '1em' }; // reduce the default margin-left on the dd elements since it looks better

  return div(
    {
      style: {
        paddingTop: '0.0em',
        paddingBottom: '0.25em',
        lineHeight: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        margin: '0 10px',
      },
    },
    [
      dl([
        dt([span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Timing:'])]),
        dd(
          {
            'aria-label': 'Workflow Start Container',
            style: ddStyle,
          },
          [span({ style: { fontWeight: 'bold' } }, ['Start: ']), span([workflowStart])]
        ),
        dd({ 'aria-label': 'Workflow End Container', style: ddStyle }, [
          span({ style: { fontWeight: 'bold' } }, ['End: ']),
          span([workflowEnd]),
        ]),
      ]),
      dl({ 'aria-label': 'Workflow Status Container' }, [
        dt([span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Status:'])]),
        dd({ style: ddStyle }, [
          div({ style: { lineHeight: '24px', marginTop: '0.25rem' } }, [
            makeStatusLine((style) => collapseStatus(status).icon(style), status),
          ]),
        ]),
      ]),
      dl([
        dt([span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Script:'])]),
        dd({ style: ddStyle }, [
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
          showLogModal,
          executionDirectory: workflowInfo?.executionDirectory,
        }),
      ]),
      showWDLModal && h(ViewWorkflowScriptModal, { workflowScript, onDismiss: () => setShowWDLModal(false) }),
    ]
  );
};
