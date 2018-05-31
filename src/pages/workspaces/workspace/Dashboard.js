import { div, h, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


export default class WorkspaceDashboard extends Component {
  refresh() {
    const { namespace, name } = this.props

    this.setState({ workspace: undefined })
    Rawls.workspace(namespace, name).details().then(
      workspace => this.setState({ workspace }),
      error => reportError(`Error loading workspace: ${error}`)
    )
  }

  render() {
    const { modal, workspace } = this.state
    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => this.refresh(),
        breadcrumbs: breadcrumbs.commonPaths.workspaceList(),
        activeTab: 'dashboard'
      },
      [
        Utils.cond(
          [!workspace, () => centeredSpinner({ style: { marginTop: '2rem' } })],
          () => div({ style: { margin: '1rem' } }, [
            modal && h(Modal, {
              onDismiss: () => this.setState({ modal: false }),
              title: 'Workspace Info',
              showCancel: false,
              okButton: 'Done',
              width: 600
            }, [
              div({ style: { whiteSpace: 'pre', overflow: 'auto', padding: '1rem' } },
                JSON.stringify(workspace, null, 2))
            ]),
            div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
              'ACCESS LEVEL'),
            span({ 'data-test-id': 'access-level' }, workspace.accessLevel),
            buttonPrimary({
              style: { marginTop: '1rem', display: 'block' },
              onClick: () => this.setState({ modal: true })
            }, 'Full Workspace Info')
          ])
        )
      ])
  }

  componentDidMount() {
    this.refresh()
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard
  })
}
