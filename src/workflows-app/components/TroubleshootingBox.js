import { div, h, span } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';

export const TroubleshootingBox = ({ name, namespace, logUri, submissionId, workflowId, showLogModal }) => {
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
      },
    },
    [
      div({}, [span({ style: { fontSize: 16, fontWeight: 'bold' } }, ['Troubleshooting?'])]),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        span({}, [span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Workflow ID: ']), span({}, [workflowId])]),
        span([h(ClipboardButton, { text: workflowId, 'aria-label': 'Copy workflow id' })]),
      ]),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        span({}, [span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Submission ID: ']), span({}, [submissionId])]),
        span([h(ClipboardButton, { text: submissionId, 'aria-label': 'Copy submission id' })]),
      ]),
      div({ style: { display: 'flex', justifyContent: 'center', paddingTop: '3px' } }, [
        h(
          Link,
          {
            onClick: () => {
              showLogModal(logUri);
            },
          },
          [div({ style: { marginRight: '1.5rem' } }, [icon('fileAlt', { size: 18 }), ' Execution Log'], {})]
        ),
        h(Link, { href: Nav.getLink('workspace-files', { name, namespace }), target: '_blank' }, [
          icon('folder-open', { size: 18 }),
          ' Execution Directory',
        ]),
      ]),
    ]
  );
};
