import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import FileBrowser from 'src/components/file-browser/FileBrowser';
import AzureBlobStorageFileBrowserProvider from 'src/libs/ajax/file-browser-providers/AzureBlobStorageFileBrowserProvider';
import GCSFileBrowserProvider from 'src/libs/ajax/file-browser-providers/GCSFileBrowserProvider';
import { forwardRefWithName } from 'src/libs/react-utils';
import { isAzureWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';
import { useMemo } from 'use-memo-one';

export const Files = _.flow(
  forwardRefWithName('Files'),
  wrapWorkspace({
    activeTab: null,
    breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Files',
    topBarContent: null,
  })
)(({ workspace }: { workspace: WorkspaceWrapper }, _ref) => {
  const { workspace: workspaceInfo } = workspace;
  const fileBrowserProvider = useMemo(() => {
    if (workspaceInfo.cloudPlatform === 'Azure') {
      const { workspaceId } = workspaceInfo;
      return AzureBlobStorageFileBrowserProvider({ workspaceId });
    }
    const { bucketName, googleProject } = workspaceInfo;
    return GCSFileBrowserProvider({ bucket: bucketName, project: googleProject });
  }, [workspaceInfo]);

  const rootLabel = isAzureWorkspace(workspace) ? 'Workspace cloud storage' : 'Workspace bucket';

  return div(
    {
      style: {
        flex: '1 1 0',
        overflow: 'hidden',
      },
    },
    [h(FileBrowser, { workspace, provider: fileBrowserProvider, rootLabel, title: 'Files' })]
  );
});

export const navPaths = [
  {
    name: 'workspace-files',
    path: '/workspaces/:namespace/:name/files',
    component: Files,
    title: ({ name }) => `${name} - Files`,
  },
];
