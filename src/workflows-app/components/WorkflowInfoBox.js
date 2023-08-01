import { useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { collapseStatus, makeStatusLine } from 'src/components/job-common';
import { makeCompleteDate } from 'src/libs/utils';
import ViewWorkflowScriptModal from 'src/workflows-app/components/ViewWorkflowScriptModal';

export const WorkflowInfoBox = ({ workflow }) => {
  const workflowStart = workflow.start ? makeCompleteDate(workflow.start) : 'N/A';
  const workflowEnd = workflow.end ? makeCompleteDate(workflow.end) : 'N/A';
  const workflowScript = workflow.submittedFiles.workflow ? workflow.submittedFiles.workflow : 'N/A';
  const status = workflow.status ? workflow.status : 'Unknown';

  const [showWDLModal, setShowWDLModal] = useState(false);

  return div(
    {
      style: {
        paddingTop: '0.25em',
        paddingBottom: '0.25em',
        lineHeight: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        width: '60%',
      },
    },
    [
      div({ 'data-testid': 'timing-container' }, [
        div({}, [span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Timing:'])]),
        div({}, [
          div({ 'data-testid': 'workflow-start-container' }, [span({ style: { fontWeight: 'bold' } }, ['Start: ']), span({}, [workflowStart])]),
          div({ 'data-testid': 'workflow-end-container' }, [span({ style: { fontWeight: 'bold' } }, ['End: ']), span({}, [workflowEnd])]),
        ]),
      ]),
      div({ 'data-testid': 'status-container', style: {} }, [
        div({}, [span({ style: { fontWeight: 'bold', fontSize: 16 } }, ['Workflow Status:'])]),
        div({}, [
          div({ style: { lineHeight: '24px', marginTop: '0.5rem' } }, [makeStatusLine((style) => collapseStatus(status).icon(style), status)]),
        ]),
      ]),
      div({ 'data-testid': 'wdl-container', style: {} }, [
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
      showWDLModal && h(ViewWorkflowScriptModal, { workflowScript, onDismiss: () => setShowWDLModal(false) }, []),
    ]
  );
};
