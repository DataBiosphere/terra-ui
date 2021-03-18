import debouncePromise from 'debounce-promise'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AsyncCreatableSelect, ButtonPrimary, ButtonSecondary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown'
import Modal from 'src/components/Modal'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { Ajax } from 'src/libs/ajax'
import { reportError, withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { workspacesStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


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

export const SnapshotInfo = ({
  workspace: { workspace: { namespace, name } }, resource: { referenceId, description, reference: { snapshot: snapshotId } }, snapshotName, onUpdate
}) => {
  // State
  const [snapshotInfo, setSelectedSnapshotInfo] = useState()
  const [newName, setNewName] = useState(snapshotName)
  const [editingName, setEditingName] = useState(false)
  const [newDescription, setNewDescription] = useState(undefined)
  const [saving, setSaving] = useState(false)

  const signal = Utils.useCancellation()


  // Helpers
  const save = async () => {
    try {
      setSaving(true) // this will be unmounted in the reload, so no need to reset this
      await Ajax().Workspaces.workspace(namespace, name).snapshot(referenceId).update({ name: newName, description: newDescription })
      onUpdate(newName)
    } catch (e) {
      setSaving(false)
      reportError('Error updating snapshot', e)
    }
  }


  // Lifecycle
  Utils.useOnMount(() => {
    const loadSnapshotInfo = async () => {
      const snapshotInfo = await Ajax(signal).DataRepo.snapshot(snapshotId).details()
      setSelectedSnapshotInfo(snapshotInfo)
    }

    loadSnapshotInfo()
  })


  // Render
  const { name: sourceName, description: sourceDescription, createdDate, source = [] } = snapshotInfo || {}
  const editingDescription = _.isString(newDescription)
  const errors = validate.single(newName, {
    format: {
      pattern: /^[a-zA-Z0-9]+\w*$/, // don't need presence requirement since '+' enforces at least 1 character
      message: 'Name can only contain letters, numbers, and underscores, and can\'t start with an underscore.'
    },
    length: { maximum: 63, tooLong: 'Name can\'t be more than 63 characters.' }
  })

  return snapshotInfo === undefined ? spinnerOverlay : h(Fragment, [
    div({ style: { padding: '1rem' } }, [
      div({ style: Style.elements.card.container }, [
        div({
          style: {
            ...Style.elements.sectionHeader, fontSize: 20,
            borderBottom: Style.standardLine, paddingBottom: '0.5rem', marginBottom: '1rem'
          }
        }, [
          snapshotName,
          !editingDescription && h(Link, {
            style: { marginLeft: '0.5rem' },
            onClick: () => setEditingName(true),
            'aria-label': 'Edit snapshot name',
            tooltip: 'Edit snapshot name'
          }, [icon('edit')])
        ]),
        div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, [
          'Description:',
          !editingDescription && h(Link, {
            style: { marginLeft: '0.5rem' },
            onClick: () => setNewDescription(description),
            'aria-label': 'Edit description',
            tooltip: 'Edit description'
          }, [icon('edit')])
        ]),
        editingDescription ? h(Fragment, [
          h(MarkdownEditor, {
            options: {
              autofocus: true,
              placeholder: 'Enter a description',
              renderingConfig: {
                singleLineBreaks: false,
                markedOptions: { sanitize: true, sanitizer: _.escape }
              },
              status: false
            },
            className: 'simplemde-container',
            value: newDescription,
            onChange: setNewDescription
          }),
          div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
            h(ButtonSecondary, { onClick: () => setNewDescription(undefined) }, 'Cancel'),
            h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: save }, 'Save')
          ])
        ]) : h(MarkdownViewer, [description])
      ]),
      div({ style: { paddingLeft: '1rem' } }, [
        div({ style: Style.dashboard.header }, ['Linked Data Repo Snapshot']),
        h(SnapshotLabeledInfo, { title: 'Name:', text: sourceName }),
        h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(createdDate) }),
        div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
        div([sourceDescription]),
        div({ style: Style.dashboard.header }, [`Source Data Repo Dataset${source.length > 1 ? 's' : ''}`]),
        _.map(({ dataset: { id, name: datasetName, description: datasetDescription, createdDate: datasetCreatedDate } }) => {
          return div({
            key: id,
            style: { marginBottom: '1rem' }
          }, [
            h(SnapshotLabeledInfo, { title: 'Name:', text: datasetName }),
            h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(datasetCreatedDate) }),
            div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
            div([datasetDescription])
          ])
        }, source)
      ]),
      editingName && h(Modal, {
        onDismiss: () => {
          setNewName(snapshotName)
          setEditingName(false)
        },
        title: `Rename ${snapshotName}`,
        okButton: h(ButtonPrimary, {
          onClick: () => {
            setEditingName(false)
            save()
          },
          disabled: !!errors || (snapshotName === newName),
          tooltip: Utils.summarizeErrors(errors) || (snapshotName === newName && 'No change to save')
        }, ['Rename'])
      }, [
        h(IdContainer, [id => h(Fragment, [
          h(FormLabel, { htmlFor: id }, ['New snapshot name']),
          h(ValidatedInput, {
            inputProps: {
              id,
              autoFocus: true,
              placeholder: 'Enter a name',
              value: newName,
              onChange: setNewName
            },
            error: Utils.summarizeErrors(errors)
          })
        ])])
      ]),
      saving && spinnerOverlay
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

export const NoWorkspacesMessage = ({ onClick }) => {
  return div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, ', h(Link, {
        onClick: () => onClick(),
        style: { fontWeight: 600 }
      }, ['Create a New Workspace'])
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(Link, {
        ...Utils.newTabLinkProps,
        href: `https://support.terra.bio/hc/en-us/articles/360022716811`
      }, [`What's a workspace?`])
    ])
  ])
}
