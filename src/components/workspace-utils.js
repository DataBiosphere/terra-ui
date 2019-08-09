import debouncePromise from 'debounce-promise'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AsyncCreatableSelect, ButtonPrimary, Link, Select } from 'src/components/common'
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

export const withWorkspaces = WrappedComponent => {
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

export const WorkspaceSelector = ({ workspaces, value, onChange, ...props }) => {
  return h(Select, {
    placeholder: 'Select a workspace',
    'aria-label': 'Select a workspace',
    disabled: !workspaces,
    value,
    onChange: ({ value }) => onChange(value),
    options: _.flow(
      _.sortBy('workspace.name'),
      _.map(({ workspace: { workspaceId, name } }) => ({ value: workspaceId, label: name }))
    )(workspaces),
    ...props
  })
}

export const WorkspaceImporter = withWorkspaces(
  ({ workspaces, refreshWorkspaces, onImport, authorizationDomain: ad, selectedWorkspaceId: initialWs }) => {
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWs)
    const [creatingWorkspace, setCreatingWorkspace] = useState(false)

    const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

    return h(Fragment, [
      h(WorkspaceSelector, {
        workspaces: _.filter(ws => {
          return Utils.canWrite(ws.accessLevel) &&
            (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
        }, workspaces),
        value: selectedWorkspaceId,
        onChange: setSelectedWorkspaceId
      }),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonPrimary, {
          disabled: !selectedWorkspace,
          onClick: () => onImport(selectedWorkspace.workspace)
        }, ['Import']),
        div({ style: { marginLeft: '1rem', whiteSpace: 'pre' } }, ['Or ']),
        h(Link, {
          onClick: () => setCreatingWorkspace(true)
        }, ['create a new workspace'])
      ]),
      creatingWorkspace && h(NewWorkspaceModal, {
        requiredAuthDomain: ad,
        onDismiss: () => setCreatingWorkspace(false),
        onSuccess: w => {
          setCreatingWorkspace(false)
          setSelectedWorkspaceId(w.workspaceId)
          refreshWorkspaces()
          onImport(w)
        }
      })
    ])
  }
)

export const WorkspaceTagSelect = props => {
  const signal = useCancellation()
  const getTagSuggestions = Utils.useInstance(() => debouncePromise(withErrorReporting('Error loading tags', async text => {
    if (text.length > 2) {
      return _.map(({ tag, count }) => {
        return { value: tag, label: `${tag} (${count})` }
      }, _.take(10, await Ajax(signal).Workspaces.getTags(text)))
    } else {
      return []
    }
  }), 250))
  return h(AsyncCreatableSelect, {
    noOptionsMessage: () => 'Enter at least 3 characters to search',
    allowCreateWhileLoading: true,
    loadOptions: getTagSuggestions,
    ...props
  })
}
