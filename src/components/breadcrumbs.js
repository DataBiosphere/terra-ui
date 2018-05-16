import { a, span } from 'react-hyperscript-helpers/lib/index'
import { breadcrumb } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'


export const breadcrumbElement = function(child, href) {
  if (href) {
    return a(
      {
        style: { color: Style.colors.textFaded, textDecoration: 'none' },
        href
      },
      [child, breadcrumb()])
  } else {
    return span(
      {
        style: { color: Style.colors.textFaded }
      },
      [child, breadcrumb()]
    )
  }
}

// These are functions, because this value is executed before nav paths exist
export const commonElements = {
  workspaces: () => breadcrumbElement('Projects', Nav.getLink('workspaces')),

  workspace: ({ namespace, name }, activeTab) =>
    breadcrumbElement(activeTab || `${namespace}/${name}`, Nav.getLink('workspace', { namespace, name, activeTab }))
}
