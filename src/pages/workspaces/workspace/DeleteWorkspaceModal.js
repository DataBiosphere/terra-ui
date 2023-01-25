import _ from 'lodash/fp'
import pluralize from 'pluralize'
import { useState } from 'react'
import { b, div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { warningBoxStyle } from 'src/components/data/data-utils'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import { getUser } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { isResourceDeletable } from 'src/pages/workspaces/workspace/analysis/runtime-utils'


const DeleteWorkspaceModal = ({ workspace: { workspace: { namespace, name, bucketName, googleProject } }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [apps, setApps] = useState()
  const [collaboratorEmails, setCollaboratorEmails] = useState()
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState()

  const signal = useCancellation()
  const isGoogleWorkspace = !!googleProject

  useOnMount(() => {
    const load = Utils.withBusyState(setLoading, async () => {
      if (isGoogleWorkspace) {
        const [currentWorkspaceAppList, { acl }, { usageInBytes }] = await Promise.all([
          Ajax(signal).Apps.listWithoutProject({ role: 'creator', saturnWorkspaceName: name }),
          Ajax(signal).Workspaces.workspace(namespace, name).getAcl(),
          Ajax(signal).Workspaces.workspace(namespace, name).bucketUsage()
        ])
        setApps(currentWorkspaceAppList)
        setCollaboratorEmails(_.without([getUser().email], _.keys(acl)))
        setWorkspaceBucketUsageInBytes(usageInBytes)
      }
    })
    load()
  })

  const [deletableApps, nonDeletableApps] = _.partition(isResourceDeletable('app'), apps)

  const getStorageDeletionMessage = () => {
    return div({ style: { marginTop: '1rem' } }, [
      'Deleting it will delete the associated ',
      isGoogleWorkspace ? h(Link, {
        ...Utils.newTabLinkProps,
        href: bucketBrowserUrl(bucketName)
      }, ['Google Cloud Bucket']) :
        'Azure Storage Container',
      ' and all its data',
      workspaceBucketUsageInBytes !== undefined && span({ style: { fontWeight: 600 } }, ` (${Utils.formatBytes(workspaceBucketUsageInBytes)})`),
      '.'
    ])
  }

  const getAppDeletionMessage = () => {
    return !_.isEmpty(nonDeletableApps) ?
      div({ style: { ...warningBoxStyle, fontSize: 14, display: 'flex', flexDirection: 'column' } }, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
          'Undeletable Workspace Warning'
        ]),
        p({ style: { fontWeight: 'normal' } }, [`You cannot delete this workspace because there are ${nonDeletableApps.length} application(s) you must delete first. Only applications in ('ERROR', 'RUNNING') status can be automatically deleted.`])
      ]) :
      p({ style: { marginLeft: '1rem', fontWeight: 'bold' } }, [`Detected ${deletableApps.length} automatically deletable application(s).`])
  }

  const hasApps = () => {
    return deletableApps !== undefined && nonDeletableApps !== undefined &&
     (!_.isEmpty(deletableApps) ||
      !_.isEmpty(nonDeletableApps))
  }

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      if (isGoogleWorkspace) {
        await Promise.all(
          _.map(async app => await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete(), deletableApps)
        )
      }
      await Ajax().Workspaces.workspace(namespace, name).delete()
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  const isDeleteDisabledFromApps = hasApps() && !_.isEmpty(nonDeletableApps)

  return h(Modal, {
    title: span({ style: { display: 'flex', alignItems: 'center' } }, [
      icon('warning-standard', { size: 24, color: colors.warning() }),
      span({ style: { marginLeft: '1ch' } }, ['Delete workspace'])
    ]),
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: _.toLower(deleteConfirmation) !== 'delete workspace' || isDeleteDisabledFromApps,
      onClick: deleteWorkspace,
      tooltip: Utils.cond(
        [isDeleteDisabledFromApps, () => 'You must ensure all apps in this workspace are deletable'],
        [_.toLower(deleteConfirmation) !== 'delete workspace', () => 'You must type the confirmation message'],
        () => 'Delete Workspace')
    }, 'Delete workspace'),
    styles: { modal: { background: colors.warning(0.1) } }
  }, [
    div(['Are you sure you want to permanently delete the workspace ',
      span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
      '?']),
    getStorageDeletionMessage(),
    hasApps() && div({ style: { marginTop: '1rem' } }, [
      p(['Deleting it will also delete any associated applications:']),
      getAppDeletionMessage()
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
    !isDeleteDisabledFromApps && b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.'),
    !isDeleteDisabledFromApps && div({ style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
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

export default DeleteWorkspaceModal
