import _ from 'lodash/fp'
import { Component, Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, linkButton, Select } from 'src/components/common'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { workspacesStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const useWorkspaces = () => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const workspaces = Utils.useAtom(workspacesStore)
  const refresh = _.flow(
    withErrorReporting('Error loading workspace list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.list()
    workspacesStore.set(ws)
  })
  Utils.useOnMount(() => {
    refresh()
  })
  return { workspaces, refresh, loading }
}

export const withWorkspaces = () => WrappedComponent => {
  const Wrapper = props => {
    const { workspaces, refresh, loading } = useWorkspaces()
    return h(WrappedComponent, {
      ...props,
      workspaces,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh
    })
  }
  Wrapper.displayName = 'withWorkspaces()'
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
      selectedWorkspaceId: props.selectedWorkspaceId,
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
