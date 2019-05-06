import { a, span } from 'react-hyperscript-helpers/lib/index'
import { breadcrumb } from 'src/components/icons'
import * as Nav from 'src/libs/nav'


export const breadcrumbElement = function(child, href) {
  if (href) {
    return a({ style: { color: 'white' }, href }, [child, breadcrumb()])
  } else {
    return span({ style: { color: 'white' } }, [child, breadcrumb()])
  }
}


export const commonPaths = {
  datasetList: () => [breadcrumbElement('Datasets', Nav.getLink('library-datasets'))],

  workspaceList: () => [breadcrumbElement('Workspaces', Nav.getLink('workspaces'))],

  workspaceDashboard: ({ namespace, name }) => [
    ...commonPaths.workspaceList(),
    breadcrumbElement(`${namespace}/${name}`, Nav.getLink('workspace-dashboard', { namespace, name }))
  ],

  workspaceTab: ({ namespace, name }, activeTab) => [
    ...commonPaths.workspaceDashboard({ namespace, name }),
    breadcrumbElement(activeTab, Nav.getLink(`workspace-${activeTab}`, { namespace, name }))
  ]
}
