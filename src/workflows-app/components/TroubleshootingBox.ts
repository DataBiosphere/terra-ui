import { div, h, span } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { LogTooltips } from 'src/workflows-app/utils/task-log-utils';

type TroubleshootingBoxProps = {
  name: string;
  namespace: string;
  logUri: string;
  submissionId: string;
  workflowId: string;
  showLogModal: (modalTitle: string, logsArray: any, tesLog: string) => void;
  executionDirectory: string;
};

export const TroubleshootingBox: React.FC<TroubleshootingBoxProps> = (props) => {
  const makePath = () => {
    const splitString = 'cbas/';
    if (!props.executionDirectory || !props.executionDirectory.includes(splitString)) {
      return 'workspace-services/cbas/';
    }
    const path = props.executionDirectory.split(splitString)[1];
    return `workspace-services/cbas/${path}/`;
  };

  return div(
    {
      style: {
        border: `1px solid ${colors.dark(0.4)}`,
        borderRadius: 5,
        paddingTop: '0.25em',
        paddingBottom: '0.25em',
        paddingLeft: '1em',
        paddingRight: '1em',
        lineHeight: '24px',
        alignSelf: 'flex-start',
        maxHeight: 'fit-content',
        margin: '0 10px',
      },
    },
    [
      div({}, [span({ style: { fontSize: 16, fontWeight: 'bold' } }, ['Troubleshooting?'])]),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        span({}, [
          span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Workflow ID: ']),
          span({}, [props.workflowId]),
        ]),
        span([h(ClipboardButton, { text: props.workflowId, 'aria-label': 'Copy workflow id' })]),
      ]),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        span({}, [
          span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Submission ID: ']),
          span({}, [props.submissionId]),
        ]),
        span([h(ClipboardButton, { text: props.submissionId, 'aria-label': 'Copy submission id' })]),
      ]),
      div({ style: { display: 'flex', justifyContent: 'center', paddingTop: '3px' } }, [
        h(
          Link,
          {
            onClick: () => {
              props.showLogModal(
                'Workflow Execution Log',
                [
                  {
                    logUri: props.logUri,
                    logTitle: 'Execution Log',
                    logKey: 'execution_log',
                    logFilename: 'workflow.log',
                    logTooltip: LogTooltips.workflowExecution,
                  },
                ],
                props.logUri
              );
            },
          },
          [div({ style: { marginRight: '1.5rem' } }, [icon('fileAlt', { size: 18 }), ' Workflow Execution Log'])]
        ),
        h(
          Link,
          {
            href: Nav.getLink(
              'workspace-files',
              { name: props.name, namespace: props.namespace },
              {
                path: makePath(),
              }
            ),
            target: '_blank',
          },
          [icon('folder-open', { size: 18 }), ' Execution Directory']
        ),
      ]),
    ]
  );
};
