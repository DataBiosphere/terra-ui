import debouncePromise from 'debounce-promise'
import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { b, div, h, p, span } from 'react-hyperscript-helpers'
import { ClipboardButton } from 'src/components/ClipboardButton'
import { AsyncCreatableSelect, ButtonPrimary, ButtonSecondary, Clickable, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import DelayedRender from 'src/components/DelayedRender'
import { icon, spinner } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown'
import Modal from 'src/components/Modal'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { ReactComponent as CloudAzureLogo } from 'src/images/cloud_azure_icon.svg'
import { ReactComponent as CloudGcpLogo } from 'src/images/cloud_google_icon.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { useCancellation, useInstance, useOnMount, useStore, withDisplayName } from 'src/libs/react-utils'
import { workspacesStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import validate from 'validate.js'


export const useWorkspaces = () => {
  const signal = useCancellation()
  const [loading, setLoading] = useState(false)
  const workspaces = useStore(workspacesStore)
  const refresh = _.flow(
    withErrorReporting('Error loading workspace list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.list([
      'accessLevel', 'public', 'workspace', 'workspace.attributes.description', 'workspace.attributes.tag:tags', 'workspace.workspaceVersion'
    ])
    workspacesStore.set(ws)
  })
  useOnMount(() => {
    refresh()
  })
  return { workspaces, refresh, loading }
}

export const useWorkspaceDetails = ({ namespace, name }, fields) => {
  const [workspace, setWorkspace] = useState()

  const [loading, setLoading] = useState(true)
  const signal = useCancellation()

  const refresh = _.flow(
    withErrorReporting('Error loading workspace details'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.workspace(namespace, name).details(fields)
    setWorkspace(ws)
  })

  useOnMount(refresh)

  return { workspace, refresh, loading }
}

export const withWorkspaces = WrappedComponent => {
  return withDisplayName('withWorkspaces', props => {
    const { workspaces, refresh, loading } = useWorkspaces()
    return h(WrappedComponent, {
      ...props,
      workspaces,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh
    })
  })
}

export const WorkspaceSelector = ({ workspaces, value, onChange, id, 'aria-label': ariaLabel, ...props }) => {
  return h(Select, {
    id,
    'aria-label': ariaLabel || 'Select a workspace',
    placeholder: 'Select a workspace',
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
  workspace: { accessLevel, workspace, workspace: { namespace, name } }, resource: { resourceId, description, snapshotId }, snapshotName,
  onUpdate, onDelete
}) => {
  // State
  const [snapshotInfo, setSelectedSnapshotInfo] = useState()
  const [snapshotLoadError, setSnapshotLoadError] = useState()
  const [newName, setNewName] = useState(snapshotName)
  const [editingName, setEditingName] = useState(false)
  const [newDescription, setNewDescription] = useState(undefined)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const signal = useCancellation()


  // Helpers
  const save = async () => {
    try {
      setSaving(true) // this will be unmounted in the reload, so no need to reset this
      await Ajax().Workspaces.workspace(namespace, name).snapshot(resourceId).update({ name: newName, description: newDescription })
      onUpdate(newName)
    } catch (e) {
      setSaving(false)
      reportError('Error updating snapshot', e)
    }
  }


  // Lifecycle
  useOnMount(() => {
    const loadSnapshotInfo = async () => {
      try {
        const snapshotInfo = await Ajax(signal).DataRepo.snapshot(snapshotId).details()
        setSelectedSnapshotInfo(snapshotInfo)
        setSnapshotLoadError(undefined)
      } catch (e) {
        try {
          e.status === 403 ?
            setSnapshotLoadError('You do not have access to this snapshot. Please review your data access.') :
            setSnapshotLoadError(`Unexpected error contacting Terra Data Repo: ${await e.json()}`)
        } catch (inner) {
          setSnapshotLoadError(`Unknown error contacting Terra Data Repo: ${JSON.stringify(e)}`)
        }
        setSelectedSnapshotInfo({})
      }
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

  const tdrErrorDisplay = () => div({ style: { paddingLeft: '1rem' } }, [
    div({ style: Style.dashboard.header }, ['Error']),
    snapshotLoadError
  ])

  const tdrDetails = () => !snapshotLoadError && div({ style: { paddingLeft: '1rem' } }, [
    div({ style: Style.dashboard.header }, ['Linked Data Repo Snapshot']),
    h(SnapshotLabeledInfo, { title: 'Name:', text: sourceName }),
    h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(createdDate) }),
    div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
    div([sourceDescription]),
    h(SnapshotLabeledInfo, {
      title: 'Data Repo Snapshot Id:', text: [h(Link, {
        href: `${getConfig().dataRepoUrlRoot}/snapshots/${snapshotId}`, target: '_blank',
        'aria-label': 'Go to the snapshot in a new tab'
      }, [snapshotId]), h(ClipboardButton, { 'aria-label': 'Copy data repo snapshot id to clipboard', text: snapshotId, style: { marginLeft: '0.25rem' } })]
    }),
    div({ style: Style.dashboard.header }, [`Source Data Repo Dataset${source.length > 1 ? 's' : ''}`]),
    _.map(({ dataset: { id, name: datasetName, description: datasetDescription, createdDate: datasetCreatedDate } }) => {
      return div({
        key: id,
        style: { marginBottom: '1rem' }
      }, [
        h(SnapshotLabeledInfo, { title: 'Name:', text: datasetName }),
        h(SnapshotLabeledInfo, { title: 'Creation Date:', text: Utils.makeCompleteDate(datasetCreatedDate) }),
        div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, ['Description:']),
        div([datasetDescription]),
        h(SnapshotLabeledInfo, {
          title: 'Data Repo Dataset Id:', text: [h(Link, {
            href: `${getConfig().dataRepoUrlRoot}/datasets/${id}`, target: '_blank',
            'aria-label': 'Go to the dataset in a new tab'
          }, [id]), h(ClipboardButton, { 'aria-label': 'Copy data repo dataset id to clipboard', text: id, style: { marginLeft: '0.25rem' } })]
        })
      ])
    }, source)
  ])

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
          Utils.canWrite(accessLevel) && !editingName && h(Link, {
            style: { marginLeft: '0.5rem' },
            onClick: () => setEditingName(true),
            tooltip: 'Edit snapshot name'
          }, [icon('edit')])
        ]),
        div({ style: { ...Style.elements.sectionHeader, marginBottom: '0.2rem' } }, [
          'Description:',
          Utils.canWrite(accessLevel) && !editingDescription && h(Link, {
            style: { marginLeft: '0.5rem' },
            onClick: () => setNewDescription(description || ''), // description is null for newly-added snapshot references
            tooltip: 'Edit description'
          }, [icon('edit')])
        ]),
        editingDescription ? h(Fragment, [
          h(MarkdownEditor, {
            placeholder: 'Enter a description',
            value: newDescription,
            onChange: setNewDescription
          }),
          div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
            h(ButtonSecondary, { onClick: () => setNewDescription(undefined) }, 'Cancel'),
            h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: save }, 'Save')
          ])
        ]) : h(MarkdownViewer, [description || '']) // description is null for newly-added snapshot references
      ]),

      snapshotLoadError ? tdrErrorDisplay() : tdrDetails(),

      Utils.canWrite(accessLevel) && div({ style: { marginTop: '2rem' } }, [
        h(ButtonSecondary, { onClick: () => setDeleting(true) }, ['Delete snapshot from workspace'])
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
      deleting && h(Modal, {
        onDismiss: () => setDeleting(false),
        okButton: async () => {
          try {
            setSaving(true) // this will be unmounted in the reload, so no need to reset this
            setDeleting(false)
            await Ajax().Workspaces.workspace(namespace, name).snapshot(resourceId).delete()
            Ajax().Metrics.captureEvent(Events.workspaceSnapshotDelete, {
              ...extractWorkspaceDetails(workspace),
              resourceId,
              snapshotId
            })
            onDelete()
          } catch (e) {
            setSaving(false)
            reportError('Error deleting snapshot', e)
          }
        },
        title: 'Delete Snapshot'
      }, [
        p([
          'Do you want to remove the snapshot ',
          b([snapshotName]),
          ' from this workspace?'
        ]),
        p([
          'Its source snapshot in the Data Repo, ',
          b([sourceName]),
          ', will be unaffected.'
        ])
      ]),
      saving && spinnerOverlay
    ])
  ])
}

export const WorkspaceImporter = _.flow(
  withDisplayName('WorkspaceImporter'),
  withWorkspaces
)(({ workspaces, refreshWorkspaces, onImport, authorizationDomain: ad, selectedWorkspaceId: initialWs, additionalErrors, ...props }) => {
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
      onChange: setSelectedWorkspaceId,
      ...props
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
  const signal = useCancellation()
  const getTagSuggestions = useInstance(() => debouncePromise(withErrorReporting('Error loading tags', async text => {
    return _.map(({ tag, count }) => {
      return { value: tag, label: `${tag} (${count})` }
    }, await Ajax(signal).Workspaces.getTags(text, 10))
  }), 250))
  return h(AsyncCreatableSelect, {
    allowCreateWhileLoading: true,
    defaultOptions: true,
    loadOptions: getTagSuggestions,
    ...props
  })
}

export const WorkspaceStarControl = ({ workspace, stars, setStars, style, updatingStars, setUpdatingStars }) => {
  const { workspace: { workspaceId } } = workspace
  const isStarred = _.includes(workspaceId, stars)

  //Thurloe has a limit of 2048 bytes for its VALUE column. That means we can store a max of 55
  //workspaceIds in list format. We'll use 50 because it's a nice round number and should be plenty
  //for the intended use case. If we find that 50 is not enough, consider introducing more powerful
  //workspace organization functionality like folders
  const MAX_STARRED_WORKSPACES = 50
  const maxStarredWorkspacesReached = _.size(stars) >= MAX_STARRED_WORKSPACES

  const refreshStarredWorkspacesList = async () => {
    const { starredWorkspaces } = Utils.kvArrayToObject((await Ajax().User.profile.get()).keyValuePairs)
    return _.isEmpty(starredWorkspaces) ? [] : _.split(',', starredWorkspaces)
  }

  const toggleStar = _.flow(
    Utils.withBusyState(setUpdatingStars),
    withErrorReporting(`Unable to ${isStarred ? 'unstar' : 'star'} workspace`)
  )(async star => {
    const refreshedStarredWorkspaceList = await refreshStarredWorkspacesList()
    const updatedWorkspaceIds = star ?
      _.concat(refreshedStarredWorkspaceList, [workspaceId]) :
      _.without([workspaceId], refreshedStarredWorkspaceList)
    await Ajax().User.profile.setPreferences({ starredWorkspaces: _.join(',', updatedWorkspaceIds) })
    Ajax().Metrics.captureEvent(Events.workspaceStar, { workspaceId, starred: star, ...extractWorkspaceDetails(workspace.workspace) })
    setStars(updatedWorkspaceIds)
  })

  return h(Clickable, {
    as: 'span',
    role: 'checkbox',
    'aria-checked': isStarred,
    tooltip: Utils.cond(
      [updatingStars, () => 'Updating starred workspaces.'],
      [isStarred, () => 'Unstar this workspace.'],
      [!isStarred && !maxStarredWorkspacesReached, () => 'Star this workspace. Starred workspaces will appear at the top of your workspace list.'],
      [!isStarred && maxStarredWorkspacesReached, () => ['A maximum of ',
        MAX_STARRED_WORKSPACES, ' workspaces can be starred. Please un-star another workspace before starring this workspace.']]
    ),
    'aria-label': isStarred ? 'This workspace is starred' : '',
    className: 'fa-layers fa-fw',
    disabled: updatingStars || (maxStarredWorkspacesReached && !isStarred),
    style: { verticalAlign: 'middle', ...style },
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        e.target.click()
      }
    },
    onClick: () => toggleStar(!isStarred)
  }, [
    updatingStars ? spinner({ size: 20 }) : icon('star', { size: 20, color: isStarred ? colors.warning() : colors.light(2) })
  ])
}

export const WorkspaceSubmissionStatusIcon = ({ status, loadingSubmissionStats, size = 20 }) => {
  return Utils.cond(
    [loadingSubmissionStats, () => h(DelayedRender, [
      h(TooltipTrigger, {
        content: 'Loading submission status',
        side: 'left'
      }, [spinner({ size })])
    ])],
    [status, () => h(TooltipTrigger, {
      content: span(['Last submitted workflow status: ', span({ style: { fontWeight: 600 } }, [_.startCase(status)])]),
      side: 'left'
    }, [
      Utils.switchCase(status,
        ['success', () => icon('success-standard', { size, style: { color: colors.success() }, 'aria-label': 'Workflow Status Success' })],
        ['failure', () => icon('error-standard', { size, style: { color: colors.danger(0.85) }, 'aria-label': 'Workflow Status Failure' })],
        ['running', () => icon('sync', { size, style: { color: colors.success() }, 'aria-label': 'Workflow Status Running' })]
      )
    ])],
    () => div({ className: 'sr-only' }, ['No workflows have been run']))
}

export const recentlyViewedPersistenceId = 'workspaces/recentlyViewed'

export const updateRecentlyViewedWorkspaces = workspaceId => {
  const recentlyViewed = getLocalPref(recentlyViewedPersistenceId)?.recentlyViewed || []
  //Recently viewed workspaces are limited to 4. Additionally, if a user clicks a workspace multiple times,
  //we only want the most recent instance stored in the list.
  const updatedRecentlyViewed = _.flow(
    _.remove({ workspaceId }),
    _.concat([{ workspaceId, timestamp: Date.now() }]),
    _.orderBy(['timestamp'], ['desc']),
    _.take(4)
  )(recentlyViewed)
  setLocalPref(recentlyViewedPersistenceId, { recentlyViewed: updatedRecentlyViewed })
}

export const RecentlyViewedWorkspaceCard = ({ workspace, submissionStatus, loadingSubmissionStats, timestamp }) => {
  const { workspace: { namespace, name, googleProject } } = workspace

  const dateViewed = Utils.makeCompleteDate(new Date(parseInt(timestamp)).toString())

  return h(Clickable, {
    style: { ...Style.elements.card.container, maxWidth: 'calc(25% - 10px)', margin: '0 0.25rem', lineHeight: '1.5rem', flex: '0 1 calc(25% - 10px)' },
    href: Nav.getLink('workspace-dashboard', { namespace, name }),
    onClick: () => {
      Ajax().Metrics.captureEvent(Events.workspaceOpenFromRecentlyViewed, extractWorkspaceDetails(workspace.workspace))
    },
  }, [
    div({ style: { flex: 'none' } }, [
      div({ style: { color: colors.accent(), ...Style.noWrapEllipsis, fontSize: 16, marginBottom: 7 } }, name),
      div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
        div({ style: { ...Style.noWrapEllipsis, whiteSpace: 'pre-wrap', fontStyle: 'italic' } }, `Viewed ${dateViewed}`),
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          h(WorkspaceSubmissionStatusIcon, {
            status: submissionStatus,
            loadingSubmissionStats
          }),
          !!googleProject ?
            h(CloudGcpLogo, { title: cloudProviders.gcp.iconTitle, role: 'img', style: { marginLeft: 5 } }) :
            h(CloudAzureLogo, { title: cloudProviders.azure.iconTitle, role: 'img', style: { marginLeft: 5 } })
        ])
      ])
    ])
  ])
}

export const NoWorkspacesMessage = ({ onClick }) => {
  return div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, ', h(Link, {
        onClick,
        style: { fontWeight: 600 }
      }, ['Create a New Workspace'])
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(Link, {
        ...Utils.newTabLinkProps,
        href: 'https://support.terra.bio/hc/en-us/articles/360024743371'
      }, ['What\'s a workspace?'])
    ])
  ])
}
