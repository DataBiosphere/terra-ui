import debouncePromise from 'debounce-promise'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AsyncCreatableSelect, ButtonPrimary, Link, Select, spinnerOverlay } from 'src/components/common'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { workspacesStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export const useWorkspaces = () => {
  const signal = Utils.useCancellation()
  const [loading, setLoading] = useState(false)
  const workspaces = Utils.useStore(workspacesStore)
  const refresh = _.flow(
    withErrorReporting('Error loading workspace list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.list([
      'accessLevel', 'public', 'workspace', 'workspaceSubmissionStats', 'workspace.attributes.description', 'workspace.attributes.tag:tags'
    ])
    workspacesStore.set(ws)
  })
  Utils.useOnMount(() => {
    refresh()
  })
  return { workspaces, refresh, loading }
}

export const withWorkspaces = WrappedComponent => {
  return Utils.withDisplayName('withWorkspaces', props => {
    const { workspaces, refresh, loading } = useWorkspaces()
    return h(WrappedComponent, {
      ...props,
      workspaces,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh
    })
  })
}

export const WorkspaceSelector = ({ workspaces, value, onChange, ...props }) => {
  return h(Select, {
    placeholder: 'Select a workspace',
    'aria-label': 'Select a workspace',
    disabled: !workspaces,
    value,
    onChange: ({ value }) => onChange(value),
    options: _.flow(
      _.sortBy(ws => ws.workspace.name.toLowerCase()),
      _.map(({ workspace: { workspaceId, name } }) => ({ value: workspaceId, label: name }))
    )(workspaces),
    ...props
  })
}

const SnapshotLabeledInfo = ({ title, text }) => {
  return div({ style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' } }, [
    div({ style: { ...Style.elements.sectionHeader, marginRight: '1rem' } }, [title]),
    text
  ])
}

export const SnapshotInfo = ({ snapshotId, snapshotName }) => {
  const [snapshotInfo, setSelectedSnapshotInfo] = useState()
  const signal = Utils.useCancellation()

  Utils.useOnMount(() => {
    const loadSnapshotInfo = async () => {
      const snapshotInfo = await Ajax(signal).DataRepo.snapshot(snapshotId).details()
      setSelectedSnapshotInfo(snapshotInfo)
    }

    loadSnapshotInfo()
  })

  const { name, description, createdDate, source = [] } = snapshotInfo || {}

  return snapshotInfo === undefined ? spinnerOverlay : h(Fragment, [
    div({ style: { padding: '1rem' } }, [
      div({
        style: {
          ...Style.elements.sectionHeader, fontSize: 20,
          borderBottom: Style.standardLine, paddingBottom: '0.5rem', marginBottom: '1rem'
        }
      }, [snapshotName]),
      h(SnapshotLabeledInfo, { title: 'Source Snapshot Name:', text: name }),
      h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(createdDate) }),
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
      div([description]),
      div({ style: Style.dashboard.header }, [`Data Repo Dataset${source.length > 1 ? 's' : ''}`]),
      _.map(({ dataset: { id, name: datasetName, description: datasetDescription, createdDate: datasetCreatedDate } }) => {
        return div({
          key: id,
          style: { ...Style.elements.card.container, marginBottom: '1rem' }
        }, [
          h(SnapshotLabeledInfo, { title: 'Dataset Name:', text: datasetName }),
          h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(datasetCreatedDate) }),
          div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
          div([datasetDescription])
        ])
      }, source)
    ])
  ])
}

export const WorkspaceImporter = _.flow(
  Utils.withDisplayName('WorkspaceImporter'),
  withWorkspaces
)(({ workspaces, refreshWorkspaces, onImport, authorizationDomain: ad, selectedWorkspaceId: initialWs, additionalErrors }) => {
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
        disabled: !selectedWorkspace || additionalErrors,
        tooltip: Utils.cond([!selectedWorkspace, () => 'Select valid a workspace to import'],
          [additionalErrors, () => Utils.summarizeErrors(additionalErrors)],
          () => 'Import workflow to workspace'
        ),
        onClick: () => onImport(selectedWorkspace.workspace)
      }, ['Import']),
      div({ style: { marginLeft: '1rem', whiteSpace: 'pre' } }, ['Or ']),
      h(Link, {
        disabled: additionalErrors,
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
})

export const WorkspaceTagSelect = props => {
  const signal = Utils.useCancellation()
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

export const canUseWorkspaceProject = async ({ canCompute, workspace: { namespace } }) => {
  return canCompute || _.some({ projectName: namespace, role: 'Owner' }, await Ajax().Billing.listProjects())
}
