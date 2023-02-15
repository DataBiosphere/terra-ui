import _ from 'lodash/fp'
import pluralize from 'pluralize'
import { useState } from 'react'
import { b, div, h, label, li, p, span, strong, ul } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { warningBoxStyle } from 'src/components/data/data-utils'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { isAzureWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils'
import { useDeleteWorkspaceState } from 'src/pages/workspaces/workspace/useDeleteWorkspaceState'


const DeleteWorkspaceModal = ({ workspace, workspace: { workspace: { name, bucketName } }, onDismiss, onSuccess }) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const {
    workspaceResources,
    loading,
    deleting,
    isDeleteDisabledFromResources,
    workspaceBucketUsageInBytes,
    collaboratorEmails,
    hasApps,
    hasRuntimes,
    deleteWorkspace,
    deleteWorkspaceResources,
    deletingResources
  } = useDeleteWorkspaceState({ workspace, onDismiss, onSuccess })


  const getStorageDeletionMessage = () => {
    return div({ style: { marginTop: '1rem' } }, [
      'Deleting it will delete the associated ',
      isGoogleWorkspace(workspace) ? h(Link, {
        ...Utils.newTabLinkProps,
        href: bucketBrowserUrl(bucketName)
      }, ['Google Cloud Bucket']) :
        'Azure Storage Container',
      ' and all its data',
      workspaceBucketUsageInBytes !== null && span({ style: { fontWeight: 600 } }, ` (${Utils.formatBytes(workspaceBucketUsageInBytes)})`),
      '.'
    ])
  }


  const getResourceDeletionMessage = () => {
    const appCount = workspaceResources.nonDeleteableApps.length > 1 ? `are ${workspaceResources.nonDeleteableApps.length}` : 'is 1'
    const googleMessage = `You cannot delete this workspace because there ${appCount} ${pluralize('application', workspaceResources.nonDeleteableApps.length,
      false)} you must delete first. Only applications in ('ERROR', 'RUNNING') status can be automatically deleted.`
    const azureMessage = 'Deleting workspaces with running cloud resources in Terra on Azure Preview is currently unavailable. Please reach out to support@terra.bio for assistance.'
    return isDeleteDisabledFromResources ?
      div({ style: { ...warningBoxStyle, fontSize: 14, display: 'flex', flexDirection: 'column' } }, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
          'Undeletable Workspace Warning'
        ]),
        p({ style: { fontWeight: 'normal' } }, [
          isGoogleWorkspace(workspace) ? googleMessage : azureMessage
        ])
      ]) :
      p({ style: { marginLeft: '1rem', fontWeight: 'bold' } },
        [`Detected ${workspaceResources.deleteableApps.length} automatically deletable ${pluralize('application', workspaceResources.deleteableApps.length, false)}.`])
  }


  const getAzureResourceCleanupModal = () => {
    return h(Modal, {
      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 24, color: colors.warning() }),
        span({ style: { marginLeft: '1ch' } }, ['Delete workspace resources'])
      ]),
      onDismiss,
      okButton: h(ButtonPrimary, {
        disabled: isDeleteDisabledFromResources,
        onClick: deleteWorkspaceResources
      }, ['Delete all resources']),
      styles: { modal: { background: colors.warning(0.1) } }
    },
    [
      isDeleteDisabledFromResources && !deletingResources && div([
        p(['This workspace has resources that are not deletable.']),
        p(['If the resource is provisioning or deleting, try again in a few minutes. Please reach out to support@terra.bio for assistance.']),
        ul([
          workspaceResources.nonDeleteableApps.map(app => li([app.appName, ` (${app.status.toLowerCase()})`])),
          workspaceResources.nonDeleteableRuntimes.map(runtime => li([runtime.runtimeName, ` (${runtime.status.toLowerCase()})`]))
        ]),
      ]),
      (!isDeleteDisabledFromResources || deletingResources) && div([
        p(['This workspace cannot be deleted because of the following running cloud resources:']),
        ul([
          workspaceResources.apps.map(app => li([app.appName])),
          workspaceResources.runtimes.map(runtime => li([runtime.runtimeName]))
        ]),
        p(['These resources must be deleted before the workspace can be deleted']),
        p(['It may take several minutes to delete all of the cloud resources in this workspace. Please do not close this window']),
        p([strong(['This cannot be undone.'])])

      ]),
      (deletingResources || loading) && spinnerOverlay
    ]
    )
  }

  const getWorkspaceDeletionModal = () => {
    return h(Modal, {
      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 24, color: colors.warning() }),
        span({ style: { marginLeft: '1ch' } }, ['Delete workspace'])
      ]),
      onDismiss,
      okButton: h(ButtonPrimary, {
        disabled: _.toLower(deleteConfirmation) !== 'delete workspace' || isDeleteDisabledFromResources,
        onClick: deleteWorkspace,
        tooltip: Utils.cond(
          [isDeleteDisabledFromResources && isGoogleWorkspace(workspace), () => 'You must ensure all apps in this workspace are deletable'],
          [isDeleteDisabledFromResources && isAzureWorkspace(workspace), () => 'This workspace cannot be deleted'],
          [_.toLower(deleteConfirmation) !== 'delete workspace', () => 'You must type the confirmation message'],
          () => '')
      }, 'Delete workspace'),
      styles: { modal: { background: colors.warning(0.1) } }
    }, [
      div(['Are you sure you want to permanently delete the workspace ',
        span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
        '?']),
      getStorageDeletionMessage(),
      isDeleteDisabledFromResources && div({ style: { marginTop: '1rem' } }, [
        getResourceDeletionMessage()
      ]),
      !isDeleteDisabledFromResources && hasApps() && div({ style: { marginTop: '1rem' } }, [
        p(['Deleting it will also delete any associated applications:']),
        getResourceDeletionMessage()
      ]),
      collaboratorEmails && collaboratorEmails.length > 0 && div({ style: { marginTop: '1rem' } }, [
        p(`${pluralize('collaborator', collaboratorEmails.length, true)} will lose access to this workspace.`),
        div(collaboratorEmails.slice(0, 5).map(
          email => div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [h(Link, { href: `mailto:${email}` }, [email])])
        )),
        collaboratorEmails.length > 5 && (
          div(`and ${collaboratorEmails.length - 5} more`)
        )
      ]),
      !isDeleteDisabledFromResources && b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.'),
      !isDeleteDisabledFromResources && div({ style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
        label({ htmlFor: 'delete-workspace-confirmation', style: { marginBottom: '0.25rem' } }, ['Please type \'Delete Workspace\' to continue:']),
        h(TextInput, {
          id: 'delete-workspace-confirmation',
          placeholder: 'Delete Workspace',
          value: deleteConfirmation,
          onChange: setDeleteConfirmation
        })
      ]),
      (deleting || loading) && spinnerOverlay
    ])
  }

  if (isAzureWorkspace(workspace) && (hasApps() || hasRuntimes() || deletingResources)) {
    return getAzureResourceCleanupModal()
  } else {
    return getWorkspaceDeletionModal()
  }
}

export default DeleteWorkspaceModal
