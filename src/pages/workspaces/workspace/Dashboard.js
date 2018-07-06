import { Fragment } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const WorkspaceDashboard = wrapWorkspace({
  breadcrumbs: () => breadcrumbs.commonPaths.workspaceList(),
  activeTab: 'dashboard'
},
class extends Component {
  render() {
    const { modal } = this.state
    const { workspace } = this.props

    return div({ style: { padding: '1rem' } }, [
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
      workspace && h(Fragment, [
        h2({}, ['Workspace Dashboard View Coming Soon']),
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'ACCESS LEVEL'),
        div({ 'data-test-id': 'access-level' }, workspace.accessLevel),
        buttonPrimary({
          style: { marginTop: '1rem' },
          onClick: () => this.setState({ modal: true })
        }, 'Full Workspace Info')
      ]),
      !workspace && spinnerOverlay
    ])
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  })
}
