import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import FileBrowser from 'src/components/file-browser/FileBrowser'
import AzureBlobStorageFileBrowserProvider from 'src/libs/ajax/file-browser-providers/AzureBlobStorageFileBrowserProvider'
import GCSFileBrowserProvider from 'src/libs/ajax/file-browser-providers/GCSFileBrowserProvider'
import { forwardRefWithName } from 'src/libs/react-utils'
import { isAzureWorkspace } from 'src/libs/workspace-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import { useMemo } from 'use-memo-one'


export const Files = _.flow(
  forwardRefWithName('Files'),
  wrapWorkspace({
    activeTab: null,
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Files',
    topBarContent: null
  })
)(({ workspace }: { workspace: any }, _ref) => {
  const fileBrowserProvider = useMemo(
    () => {
      if (isAzureWorkspace(workspace)) {
        const { workspaceId } = workspace.workspace
        return AzureBlobStorageFileBrowserProvider({ workspaceId })
      } else {
        const { bucketName, googleProject } = workspace.workspace
        return GCSFileBrowserProvider({ bucket: bucketName, project: googleProject })
      }
    },
    [workspace]
  )

  const rootLabel = isAzureWorkspace(workspace) ? 'Workspace cloud storage' : 'Workspace bucket'

  return div({
    style: {
      flex: '1 1 0',
      overflow: 'hidden'
    }
  }, [
    h(FileBrowser, { workspace, provider: fileBrowserProvider, rootLabel, title: 'Files' })
  ])
})

export const navPaths = [
  {
    name: 'workspace-files',
    path: '/workspaces/:namespace/:name/files',
    component: Files,
    title: ({ name }) => `${name} - Files`
  }
]
