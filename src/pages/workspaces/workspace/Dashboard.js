import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Rawls } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


export default class WorkspaceDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = StateHistory.get()
  }

  refresh() {
    const { namespace, name } = this.props

    Rawls.workspace(namespace, name).details().then(
      workspace => this.setState({ isDataLoaded: true, workspace }),
      error => reportError('Error loading workspace', error)
    )
  }

  render() {
    const { isDataLoaded, modal, workspace } = this.state
    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => {
          this.setState({ isDataLoaded: false })
          this.refresh()
        },
        breadcrumbs: breadcrumbs.commonPaths.workspaceList(),
        activeTab: 'dashboard'
      },
      [
        div({ style: { padding: '1rem' } }, [
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
            div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
              'ACCESS LEVEL'),
            span({ 'data-test-id': 'access-level' }, workspace.accessLevel),
            buttonPrimary({
              style: { marginTop: '1rem', display: 'block' },
              onClick: () => this.setState({ modal: true })
            }, 'Full Workspace Info')
          ]),
          !isDataLoaded && spinnerOverlay
        ])
      ])
  }

  componentDidMount() {
    this.refresh()
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(['workspace'], this.state))
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace', {
    path: '/workspaces/:namespace/:name',
    component: WorkspaceDashboard,
    title: ({ name }) => `${name} - Dashboard`
  })
}
