import { a, span } from 'react-hyperscript-helpers/lib/index'
import { breadcrumb } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'


export const breadcrumbElement = function(child, href) {
  if (href) {
    return a({ style: { color: colors.gray[2] }, href }, [child, breadcrumb()])
  } else {
    return span({ style: { color: colors.gray[2] } }, [child, breadcrumb()])
  }
}


export const commonPaths = {
  workspaceList: () => [breadcrumbElement('Workspaces', Nav.getLink('workspaces'))],

  workspaceDashboard: ({ namespace, name }) => [
    ...commonPaths.workspaceList(),
    breadcrumbElement(`${namespace}/${name}`, Nav.getLink('workspace', { namespace, name }))
  ],

  workspaceTab: ({ namespace, name }, activeTab) => [
    ...commonPaths.workspaceDashboard({ namespace, name }),
    breadcrumbElement(activeTab, Nav.getLink(`workspace-${activeTab}`, { namespace, name }))
  ]
}
