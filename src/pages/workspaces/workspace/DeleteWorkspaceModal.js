import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { warningBoxStyle } from 'src/components/data/data-utils'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl, getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { isAppDeletable } from 'src/libs/runtime-utils'
import * as Utils from 'src/libs/utils'


const LoadApps = workspaceName => {
  const signal = Utils.useCancellation()
  const [deletableApps, setDeletableApps] = useState()
  const [nonDeletableApps, setNonDeletableApps] = useState()

  const load = async () => {
    const [currentWorkspaceAppList] = await Promise.all([
      Ajax(signal).Apps.listWithoutProject({ creator: getUser().email, saturnWorkspaceName: workspaceName })
    ])
    const appPartition = _.partition(isAppDeletable, currentWorkspaceAppList)
    setDeletableApps(appPartition[0])
    setNonDeletableApps(appPartition[1])
  }

  Utils.useOnMount(() => {
    load()
  })

  return { deletableApps, nonDeletableApps }
}

const DeleteWorkspaceModal = ({ workspace: { workspace: { namespace, name, bucketName } }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const { deletableApps, nonDeletableApps } = LoadApps(name)

  const getAppDeletionMessage = (deletableApps, nonDeletableApps) => {
    return nonDeletableApps.length > 0 ?
      div({ style: { ...warningBoxStyle, fontSize: 14, display: 'flex', flexDirection: 'column' } }, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
          icon('warning-standard', { size: 19, style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' } }),
          'Undeletable Workspace Warning'
        ]),
        p({ style: { fontWeight: 'normal' } }, `You cannot delete this workspace because there are ${nonDeletableApps.length} application(s) you must delete first. Only applications in ('ERROR', 'RUNNING') status can be automatically deleted.`)
      ]) :
      p({ style: { marginLeft: '1rem', fontWeight: 'bold' } }, `Detected ${deletableApps.length} automatically deletable application(s).`)
  }

  const hasApps = (deletableApps, nonDeletableApps) => {
    return deletableApps !== undefined && nonDeletableApps !== undefined &&
      (deletableApps.length > 0 ||
      nonDeletableApps.length > 0)
  }

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      await Ajax().Workspaces.workspace(namespace, name).delete()
      await Promise.all(
        _.map(async app => await Ajax().Apps.app(app.googleProject, app.appName).delete(), deletableApps)
      )
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  const isDeleteDisabledWithApps = (deletableApps, nonDeletableApps) => hasApps(deletableApps, nonDeletableApps) && nonDeletableApps.length !== 0

  return h(Modal, {
    title: 'Delete workspace',
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: _.toLower(deleteConfirmation) !== 'delete workspace' || isDeleteDisabledWithApps(deletableApps, nonDeletableApps),
      onClick: () => deleteWorkspace(),
      tooltip: _.toLower(deleteConfirmation) !== 'delete workspace' ?
        isDeleteDisabledWithApps(deletableApps, nonDeletableApps) ? 'You must ensure all apps in this workspace are deletable' : 'You must type the confirmation message' :
        'Delete Workspace'
    }, 'Delete workspace')
  }, [
    div(['Are you sure you want to permanently delete the workspace ',
      span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, name),
      '?']),
    div({ style: { marginTop: '1rem' } }, [
      'Deleting it will delete the associated ',
      h(Link, {
        ...Utils.newTabLinkProps,
        href: bucketBrowserUrl(bucketName)
      }, ['Google Cloud Bucket']),
      ' and all its data.'
    ]),
    hasApps(deletableApps, nonDeletableApps) && div({ style: { marginTop: '1rem' } }, [
      p('Deleting it will also delete any associated applications:'),
      getAppDeletionMessage(deletableApps, nonDeletableApps)
    ]),
    !isDeleteDisabledWithApps(deletableApps, nonDeletableApps) && div({
      style: {
        fontWeight: 500,
        marginTop: '1rem'
      }
    }, 'This cannot be undone.'),
    !isDeleteDisabledWithApps(deletableApps, nonDeletableApps) && div({ style: { marginTop: '1rem' } }, [
      label({ htmlFor: 'delete-workspace-confirmation' }, ['Please type \'Delete Workspace\' to continue:']),
      h(TextInput, {
        id: 'delete-workspace-confirmation',
        placeholder: 'Delete Workspace',
        value: deleteConfirmation,
        onChange: setDeleteConfirmation
      })
    ]),
    deleting && spinnerOverlay
  ])
}

export default DeleteWorkspaceModal
