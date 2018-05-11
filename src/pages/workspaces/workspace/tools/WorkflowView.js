import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as Breadcrumbs from 'src/components/breadcrumbs'
import { TopBar } from 'src/components/TopBar'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


class WorkflowView extends Component {
  render() {
    const { workspaceNamespace, workspaceName, workflowName } = this.props
    const workspaceId = { namespace: workspaceNamespace, name: workspaceName }

    return h(Fragment, [
      h(TopBar, { title: 'Projects' }, [
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            div([
              Breadcrumbs.commonElements.workspaces(),
              Breadcrumbs.commonElements.workspace(workspaceId),
              Breadcrumbs.commonElements.workspace(workspaceId, 'tools')
            ]),
            div({ style: { fontSize: '1.25rem' } }, workflowName)
          ])
      ]),
      div({},
        `${workspaceNamespace}/${workspaceName} - ${workflowName}`)
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowName',
    component: WorkflowView
  })
}
