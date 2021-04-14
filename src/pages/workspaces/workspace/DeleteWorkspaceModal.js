import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { bucketBrowserUrl, getUser } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const LoadApps = workspaceName => {
  const signal = Utils.useCancellation()
  const [apps, setApps] = useState()

  const load = async () => {
    const [currentWorkspaceAppList] = await Promise.all([
      Ajax(signal).Apps.listWithoutProject({ creator: getUser().email, saturnWorkspaceName: workspaceName })
    ])
    setApps(currentWorkspaceAppList)
  }

  Utils.useOnMount(() => {
    load()
  })

  return { apps }
}

const DeleteWorkspaceModal = ({ workspace: { workspace: { namespace, name, bucketName } }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const { apps } = LoadApps(name)

  const getDeletableApps = apps => _.filter(app => app.status === 'RUNNING' || app.status === 'ERROR', apps)
  const getAppCountMessage = apps => {
    console.log('in getAppCountMessage')
    console.dir(apps)
    const deletableApps = getDeletableApps(apps)
    console.log('in getAppCountMessage, deleteable apps')
    console.dir(deletableApps)
    return deletableApps.length > 1 ? `${deletableApps.length} apps` : `${deletableApps.length} app`
  }

  const deleteWorkspace = async () => {
    try {
      setDeleting(true)
      await Ajax().Workspaces.workspace(namespace, name).delete()
      await Promise.all(
        _.flow(
          getDeletableApps,
          _.map(async app => await Ajax().Apps.app(app.googleProject, app.appName).delete())
        )(apps)
      )
      onDismiss()
      onSuccess()
    } catch (error) {
      reportError('Error deleting workspace', error)
      setDeleting(false)
    }
  }

  console.log('apps:')
  console.dir(apps)

  return h(Modal, {
    title: 'Delete workspace',
    onDismiss,
    okButton: h(ButtonPrimary, {
      disabled: _.toLower(deleteConfirmation) !== 'delete workspace',
      onClick: () => deleteWorkspace()
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
    apps && apps.length > 0 && div({ style: { marginTop: '1rem' } }, [
      `Deleting it will also delete the associated ${getAppCountMessage(apps)}.`
    ]),
    div({
      style: {
        fontWeight: 500,
        marginTop: '1rem'
      }
    }, 'This cannot be undone.'),
    div({ style: { marginTop: '1rem' } }, [
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
