import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import FileBrowser from 'src/components/file-browser/FileBrowser'
import GCSFileBrowserProvider from 'src/libs/ajax/file-browser-providers/GCSFileBrowserProvider'
import { forwardRefWithName } from 'src/libs/react-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import { useMemo } from 'use-memo-one'


export const WorkspaceFiles = _.flow(
  forwardRefWithName('WorkspaceFiles'),
  wrapWorkspace({
    activeTab: null,
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    showTabBar: false,
    title: 'Files',
    topBarContent: null
  })
)(({ workspace }, _ref) => {
  const { bucketName, googleProject } = workspace.workspace

  const fileBrowserProvider = useMemo(
    () => GCSFileBrowserProvider({ bucket: bucketName, project: googleProject }),
    [bucketName, googleProject]
  )

  return div({
    style: {
      flex: '1 1 0',
      overflow: 'hidden'
    }
  }, [
    h(FileBrowser, { provider: fileBrowserProvider, title: 'Files' })
  ])
})

export const navPaths = [
  {
    name: 'workspace-files',
    path: '/workspaces/:namespace/:name/files',
    component: WorkspaceFiles,
    title: ({ name }) => `${name} - Files`
  }
]
