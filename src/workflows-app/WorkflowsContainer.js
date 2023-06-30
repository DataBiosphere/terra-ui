import _ from 'lodash/fp';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { forwardRefWithName } from 'src/libs/react-utils';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

export const wrapWorkflowsPage = ({ name }) =>
  _.flow(
    forwardRefWithName(name),
    wrapWorkspace({
      breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
      title: 'Workflows',
      activeTab: 'workflows',
    })
  );
