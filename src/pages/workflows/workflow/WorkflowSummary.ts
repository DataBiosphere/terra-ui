import * as clipboard from 'clipboard-polyfill/text';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import { forwardRefWithName, useStore } from 'src/libs/react-utils';
import { snapshotStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import { WorkflowRightBoxSection } from 'src/pages/workflows/components/WorkflowRightBoxSection';
import { wrapWorkflows } from 'src/pages/workflows/workflow/WorkflowWrapper';

type InfoTileProps = {
  title: string;
  children: any;
};

// TODO: add error handling, dedupe
const InfoTile = (props: InfoTileProps) => {
  const { title, children } = props;
  return div({ style: Style.dashboard.infoTile }, [
    div({ style: Style.dashboard.tinyCaps }, [title]),
    div({ style: { fontSize: 12 } }, [children]),
  ]);
};

export const BaseWorkflowSummary = () => {
  const {
    namespace,
    name,
    snapshotId,
    createDate,
    managers,
    synopsis,
    documentation,
    public: isPublic,
  } = useStore(snapshotStore);
  const [importUrlCopied, setImportUrlCopied] = useState<boolean>();
  const importUrl = `${
    getConfig().orchestrationUrlRoot
  }/ga4gh/v1/tools/${namespace}:${name}/versions/${snapshotId}/plain-WDL/descriptor`;

  return div({ style: { flex: 1, display: 'flex' }, role: 'tabpanel' }, [
    div({ style: Style.dashboard.leftBox }, [
      synopsis &&
        h(Fragment, [
          h2({ style: Style.dashboard.header }, ['Synopsis']),
          div({ style: { fontSize: 16 } }, [synopsis]),
        ]),
      h2({ style: Style.dashboard.header }, ['Documentation']),
      documentation
        ? h(MarkdownViewer, { renderers: { link: newWindowLinkRenderer } }, [documentation])
        : div({ style: { fontStyle: 'italic' } }, ['No documentation provided']),
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h(WorkflowRightBoxSection, { title: 'hi', info: 'hello', panelOpen: true }, []),
      h2({ style: Style.dashboard.header }, ['Snapshot ']),
      div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
        h(InfoTile, { title: 'Creation date' }, [new Date(createDate).toLocaleDateString()]),
        h(InfoTile, { title: 'Public' }, [_.startCase(isPublic as unknown as string)]),
      ]),
      h2({ style: Style.dashboard.header }, ['Ownerskjhygtfr']),
      _.map((email) => {
        return div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [
          h(Link, { href: `mailto:${email}` }, [email]),
        ]);
      }, managers),
      div({ style: { margin: '1.5rem 0 1rem 0', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
      h2({ style: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' } }, ['Import URL']),
      div({ style: { display: 'flex' } }, [
        div({ style: Style.noWrapEllipsis }, [importUrl]),
        h(
          Link,
          {
            style: { margin: '0 0.5rem', flexShrink: 0 },
            tooltip: 'Copy import URL',
            onClick: withErrorReporting('Error copying to clipboard')(async () => {
              await clipboard.writeText(importUrl);
              setImportUrlCopied(true);
              setTimeout(() => setImportUrlCopied, 1500);
            }),
          },
          [icon(importUrlCopied ? 'check' : 'copy-to-clipboard')]
        ),
      ]),
    ]),
  ]);
};

const WorkflowSummary = _.flow(
  forwardRefWithName('WorkflowSummary'),
  wrapWorkflows({
    breadcrumbs: () => breadcrumbs.commonPaths.workflowList(),
    title: 'Workflows',
    activeTab: 'dashboard',
  })
)(() => {
  return h(BaseWorkflowSummary);
});

export const navPaths = [
  {
    name: 'workflow-dashboard',
    path: '/workflows/:namespace/:name/:snapshotId?',
    component: (props) => h(WorkflowSummary, { ...props, tabName: 'dashboard' }),
    title: ({ name }) => `${name} - Dashboard`,
  },
];
