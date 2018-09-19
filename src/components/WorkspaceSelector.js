import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import { Select } from 'src/components/common'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class WorkspaceSelector extends Component {
  render() {
    const { onWorkspaceSelected, selectedWorkspace } = this.props
    const { workspaces } = this.state

    return h(Select, {
      isClearable: false,
      isDisabled: !workspaces,
      placeholder: workspaces ? 'Select a workspace' : 'Loading workspaces...',
      value: selectedWorkspace,
      onChange: selectedWorkspace => onWorkspaceSelected(selectedWorkspace),
      options: _.map(({ workspace }) => {
        return { value: workspace, label: workspace.name }
      }, workspaces)
    })
  }

  async componentDidMount() {
    const { authorizationDomain: ad, filter, ajax: { Workspaces } } = this.props

    try {
      const workspaces = _.flow(
        ad ? _.filter(({ workspace: { authorizationDomain } }) => _.flatMap(_.values, authorizationDomain).includes(ad)) : _.identity,
        filter ? _.filter(filter) : _.identity
      )(await Workspaces.list())

      this.setState({ workspaces })
    } catch (error) {
      reportError('Error loading workspaces', error)
    }
  }
})
