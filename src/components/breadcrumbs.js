import { a, span } from 'react-hyperscript-helpers/lib/index'
import { breadcrumb } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


export const breadcrumbElement = function(child, href) {
  if (href) {
    return a({ style: { color: Style.colors.textFaded }, href }, [child, breadcrumb()])
  } else {
    return span({ style: { color: Style.colors.textFaded } }, [child, breadcrumb()])
  }
}


export const commonPaths = {
  workspaceList: () => [breadcrumbElement('Projects', Nav.getLink('workspaces'))],

  workspaceDashboard: ({ namespace, name }) => [
    ...commonPaths.workspaceList(),
    breadcrumbElement(`${namespace}/${name}`, Nav.getLink('workspace', { namespace, name }))
  ],

  workspaceTab: ({ namespace, name }, activeTab) => [
    ...commonPaths.workspaceDashboard({ namespace, name }),
    breadcrumbElement(activeTab, Nav.getLink(`workspace-${activeTab}`, { namespace, name }))
  ]
}
