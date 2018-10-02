import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, linkButton, Select } from 'src/components/common'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class WorkspaceSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      workspaces: undefined,
      selectedWorkspaceId: undefined,
      creatingWorkspace: false
    }
  }

  componentDidMount() {
    this.refresh()
  }

  async refresh() {
    try {
      const { ajax: { Workspaces } } = this.props
      const workspaces = await Workspaces.list()
      this.setState({ workspaces })
    } catch (error) {
      reportError('Error loading workspaces', error)
    }
  }

  getSelectedWorkspace() {
    const { workspaces, selectedWorkspaceId } = this.state
    return _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)
  }

  render() {
    const { onImport, authorizationDomain: ad } = this.props
    const { workspaces, selectedWorkspaceId, creatingWorkspace } = this.state

    return div([
      h(Select, {
        placeholder: workspaces ? 'Select a workspace' : 'Loading workspaces...',
        value: selectedWorkspaceId,
        onChange: ({ value }) => this.setState({ selectedWorkspaceId: value }),
        options: _.flow(
          _.filter(w => {
            return (!ad || _.some({ membersGroupName: ad }, w.workspace.authorizationDomain)) &&
              Utils.canWrite(w.accessLevel)
          }),
          _.map(({ workspace }) => ({ value: workspace.workspaceId, label: workspace.name })),
          _.sortBy('label')
        )(workspaces)
      }),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        buttonPrimary({
          disabled: !this.getSelectedWorkspace(),
          onClick: () => onImport(this.getSelectedWorkspace().workspace)
        }, ['Import']),
        div({ style: { marginLeft: '1rem', whiteSpace: 'pre' } }, ['Or ']),
        linkButton({
          onClick: () => this.setState({ creatingWorkspace: true })
        }, ['create a new workspace'])
      ]),
      creatingWorkspace && h(NewWorkspaceModal, {
        requiredAuthDomain: ad,
        onDismiss: () => this.setState({ creatingWorkspace: false }),
        onSuccess: w => {
          this.setState({ creatingWorkspace: false, selectedWorkspaceId: w.workspaceId })
          this.refresh()
          onImport(w)
        }
      })
    ])
  }
})
