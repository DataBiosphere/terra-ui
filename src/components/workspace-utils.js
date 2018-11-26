import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, linkButton, Select } from 'src/components/common'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'

export const withWorkspaces = ({ persist } = {}) => WrappedComponent => {
  const Wrapper = ajaxCaller(class extends Component {
    constructor(props) {
      super(props)
      this.state = {
        workspaces: persist ? StateHistory.get().workspaces : undefined,
        loadingWorkspaces: false
      }
    }

    static displayName = 'withWorkspaces()'

    async refresh() {
      try {
        const { ajax: { Workspaces } } = this.props
        this.setState({ loadingWorkspaces: true })
        const workspaces = await Workspaces.list()
        this.setState({ workspaces })
      } catch (error) {
        reportError('Error loading workspace list', error)
      } finally {
        this.setState({ loadingWorkspaces: false })
      }
    }

    componentDidMount() {
      this.refresh()
    }

    componentDidUpdate() {
      if (persist) {
        const { workspaces } = this.state
        StateHistory.update({ workspaces })
      }
    }

    render() {
      const { workspaces, loadingWorkspaces } = this.state
      return h(WrappedComponent, {
        ...this.props,
        workspaces,
        loadingWorkspaces,
        refreshWorkspaces: () => this.refresh()
      })
    }
  })
  return Wrapper
}

export const WorkspaceSelector = ({ workspaces, value, onChange }) => {
  return h(Select, {
    placeholder: 'Select a workspace',
    disabled: !workspaces,
    value,
    onChange: ({ value }) => onChange(value),
    options: _.flow(
      _.sortBy('workspace.name'),
      _.map(({ workspace: { workspaceId, name } }) => ({ value: workspaceId, label: name }))
    )(workspaces)
  })
}

export const WorkspaceImporter = withWorkspaces()(class WorkspaceImporter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedWorkspaceId: undefined,
      creatingWorkspace: false
    }
  }

  getSelectedWorkspace() {
    const { workspaces } = this.props
    const { selectedWorkspaceId } = this.state
    return _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)
  }

  render() {
    const { workspaces, refreshWorkspaces, onImport, authorizationDomain: ad } = this.props
    const { selectedWorkspaceId, creatingWorkspace } = this.state
    return h(Fragment, [
      h(WorkspaceSelector, {
        workspaces: _.filter(ws => {
          return Utils.canWrite(ws.accessLevel) &&
            (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
        }, workspaces),
        value: selectedWorkspaceId,
        onChange: v => this.setState({ selectedWorkspaceId: v })
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
          refreshWorkspaces()
          onImport(w)
        }
      })
    ])
  }
})
