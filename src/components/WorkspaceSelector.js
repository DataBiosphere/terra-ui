import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { Select } from 'src/components/common'
import { Workspaces } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import { Component } from 'src/libs/wrapped-components'


export default class WorkspaceSelector extends Component {
  render() {
    const { onWorkspaceSelected, selectedWorkspace } = this.props
    const { workspaces } = this.state

    return h(Select, {
      clearable: false,
      disabled: !workspaces,
      placeholder: workspaces ? 'Select a workspace' : 'Loading workspaces...',
      value: selectedWorkspace,
      onChange: selectedWorkspace => onWorkspaceSelected(selectedWorkspace),
      options: _.map(({ workspace }) => {
        return { value: workspace, label: workspace.name }
      }, workspaces)
    })
  }

  async componentDidMount() {
    const { authorizationDomain: ad } = this.props

    try {
      const workspaces = await Workspaces.list()
      const filtered = ad ?
        _.filter(({ workspace: { authorizationDomain } }) => _.flatMap(_.values, authorizationDomain).includes(ad), workspaces) :
        workspaces
      this.setState({ workspaces: filtered })
    } catch (error) {
      reportError('Error loading workspaces', error)
    }
  }
}
