import { div } from 'react-hyperscript-helpers'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'

class WorkflowView extends Component {
  render() {
    const { workspaceNamespace, workspaceName, workflowName } = this.props

    return div({},
      `${workspaceNamespace}/${workspaceName} - ${workflowName}`)
  }
}

export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowName',
    component: WorkflowView
  })
}
