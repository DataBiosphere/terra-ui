import { Icon, Link, useThemeFromContext } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import { dd, div, dl, dt, h, span } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import * as Nav from 'src/libs/nav';
import { LogTooltips } from 'src/workflows-app/utils/task-log-utils';

interface TroubleshootingBoxProps {
  name: string;
  namespace: string;
  logUri: string;
  submissionId: string;
  workflowId: string;
  showLogModal: (modalTitle: string, logsArray: any[], tesLog: string) => void;
  executionDirectory: string | undefined;
}

export const TroubleshootingBox = (props: TroubleshootingBoxProps): ReactNode => {
  const colorPalette = useThemeFromContext();
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
        border: `1px solid ${colorPalette.colors.dark(0.4)}`,
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
      dl({ style: { margin: 0 } }, [
        dt([span({ style: { fontSize: 16, fontWeight: 'bold' } }, ['Troubleshooting?'])]),
        dd({ style: { display: 'flex', justifyContent: 'space-between', marginLeft: 0 } }, [
          span([
            span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Workflow ID: ']),
            span([props.workflowId]),
          ]),
          span([h(ClipboardButton, { text: props.workflowId, 'aria-label': 'Copy workflow id' })]),
        ]),
        dd({ style: { display: 'flex', justifyContent: 'space-between', marginLeft: 0 } }, [
          span([
            span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Submission ID: ']),
            span([props.submissionId]),
          ]),
          span([h(ClipboardButton, { text: props.submissionId, 'aria-label': 'Copy submission id' })]),
        ]),
        dd({ style: { display: 'flex', justifyContent: 'center', paddingTop: '3px', marginLeft: 0 } }, [
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
            [
              div({ style: { marginRight: '1.5rem' } }, [
                h(Icon, { icon: 'fileAlt', size: 18 }),
                ' Workflow Execution Log',
              ]),
            ]
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
            [h(Icon, { icon: 'folder-open', size: 18 }), ' Execution Directory']
          ),
        ]),
      ]),
    ]
  );
};
