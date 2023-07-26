/* eslint-disable prettier/prettier */
import _ from 'lodash/fp';
import { Fragment } from 'react';
import { h, iframe } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { forwardRefWithName } from 'src/libs/react-utils';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

const WorkspaceDataViz = _.flow(
  forwardRefWithName('WorkspaceDataViz'),
  wrapWorkspace({
    breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'DataViz',
    activeTab: 'dataviz',
  })
)(() => {
  return h(Fragment, [
    // <iframe src="http://localhost:5601/app/dashboards?security_tenant=global#/view/c6df6630-2bf7-11ee-b4bf-57b45cfe6db3?embed=true&_g=(filters%3A!()%2CrefreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow-15m%2Cto%3Anow))&hide-filter-bar=true" height="600" width="800"></iframe>
    iframe({
      style: { height: 800, width: 1600, border: 'none', flex: 1 },
      src:
        'http://localhost:5601/app/dashboards?security_tenant=global#/view/c6df6630-2bf7-11ee-b4bf-57b45cfe6db3?embed=true&_g=(filters%3A!()%2CrefreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2Ctime%3A(from%3Anow-15m%2Cto%3Anow))&hide-filter-bar=true',
      title: 'OpenSearch dashboard',
    }),
  ]);
});

export const navPaths = [
  {
    name: 'workspace-dataviz',
    path: '/workspaces/:namespace/:name/dataviz',
    component: WorkspaceDataViz,
    title: ({ name }) => `${name} - DataViz`,
  },
];
