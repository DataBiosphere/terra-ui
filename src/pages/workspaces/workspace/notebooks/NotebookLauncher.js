import _ from 'lodash/fp'
import { forwardRef, Fragment, useRef, useState } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { NewClusterModal } from 'src/components/ClusterManager'
import { ButtonOutline, ButtonPrimary, Link } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { notify } from 'src/components/Notifications'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const StatusMessage = ({ showSpinner, children }) => {
  return div({ style: { padding: '1.5rem 2rem', display: 'flex' } }, [
    showSpinner && spinner({ style: { marginRight: '0.5rem' } }),
    div([children])
  ])
}

const NotebookLauncher = _.flow(
  forwardRef,
  requesterPaysWrapper({
    onDismiss: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'notebooks'),
    title: _.get('notebookName'),
    showTabBar: false
  })
)(({ queryParams = {}, notebookName, workspace, workspace: { accessLevel, canCompute }, cluster, refreshClusters, onRequesterPaysError }, ref) => {
  return (Utils.canWrite(accessLevel) && canCompute && !queryParams['read-only']) ?
    h(NotebookEditor, { notebookName, workspace, cluster, refreshClusters }) :
    h(Fragment, [
      h(ReadOnlyMessage, { notebookName, workspace }),
      h(NotebookPreviewFrame, { notebookName, workspace, onRequesterPaysError })
    ])
})

const ReadOnlyMessage = ({ notebookName, workspace, workspace: { canCompute, workspace: { namespace, name } } }) => {
  const [copying, setCopying] = useState(false)

  return div({ style: { padding: '1rem 2rem', display: 'flex', alignItems: 'center' } }, [
    div({ style: { fontSize: 16, fontWeight: 'bold', position: 'absolute' } },
      ['Viewing read-only']),
    div({ style: { flexGrow: 1 } }),
    Utils.cond(
      [!canCompute, () => h(ButtonOutline, { onClick: () => setCopying(true) }, ['copy to another workspace to edit'])],
      () => h(ButtonOutline, {
        href: Nav.getLink('workspace-notebook-launch', { namespace, name, notebookName })
      }, ['edit in Jupyter'])
    ),
    div({ style: { flexGrow: 1 } }),
    copying && h(ExportNotebookModal, {
      printName: notebookName.slice(0, -6), workspace, fromLauncher: true,
      onDismiss: () => setCopying(false)
    })
  ])
}

const NotebookPreviewFrame = ({ notebookName, workspace: { workspace: { namespace, name, bucketName } }, onRequesterPaysError }) => {
  const signal = useCancellation()
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState()
  const frame = useRef()

  const loadPreview = _.flow(
    Utils.withBusyState(setBusy),
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error previewing notebook')
  )(async () => {
    setPreview(await Ajax(signal).Buckets.notebook(namespace, bucketName, notebookName).preview())
  })
  Utils.useOnMount(() => {
    loadPreview()
  })

  return h(Fragment, [
    preview && h(Fragment, [
      div({ style: { position: 'relative' } }, [
        h(ButtonPrimary, {
          style: { position: 'absolute', top: 20, left: 'calc(50% + 580px)' },
          onClick: () => Nav.goToPath('workspace-notebooks', { namespace, name })
        }, ['Close'])
      ]),
      iframe({
        ref: frame,
        onLoad: () => {
          const doc = frame.current.contentWindow.document
          doc.head.appendChild(Utils.createHtmlElement(doc, 'base', Utils.newTabLinkProps))
        },
        style: { border: 'none', flex: 1 },
        srcDoc: preview,
        title: 'Preview for notebook'
      })
    ]),
    busy && div({ style: { margin: '0.5rem 2rem' } }, ['Generating preview...'])
  ])
}

const JupyterFrameManager = ({ onClose, frameRef }) => {
  Utils.useOnMount(() => {
    const isSaved = Utils.atom(true)
    const onMessage = e => {
      switch (e.data) {
        case 'close': return onClose()
        case 'saved': return isSaved.set(true)
        case 'dirty': return isSaved.set(false)
        default:
      }
    }
    const saveNotebook = () => {
      frameRef.current.contentWindow.postMessage('save', '*')
    }
    const onBeforeUnload = e => {
      if (!isSaved.get()) {
        saveNotebook()
        e.preventDefault()
      }
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('beforeunload', onBeforeUnload)
    Nav.blockNav.set(() => new Promise(resolve => {
      if (isSaved.get()) {
        resolve()
      } else {
        saveNotebook()
        isSaved.subscribe(resolve)
      }
    }))
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('beforeunload', onBeforeUnload)
      Nav.blockNav.reset()
    }
  })
  return null
}

const NotebookEditorFrame = ({ notebookName, workspace: { workspace: { namespace, name, bucketName } }, cluster: { clusterName, clusterUrl, status } }) => {
  console.assert(status === 'Running', 'Expected cluster to be running')
  const signal = useCancellation()
  const frameRef = useRef()
  const [busy, setBusy] = useState(false)
  const [localized, setLocalized] = useState(false)
  const localizeNotebook = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error copying notebook')
  )(async () => {
    await Promise.all([
      Ajax(signal).Jupyter.notebooks(namespace, clusterName).localize({
        [`~/${name}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`,
        [`~/${name}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
      }),
      Ajax(signal).Jupyter.notebooks(namespace, clusterName).setCookie()
    ])
    setLocalized(true)
  })
  const checkRecentAccess = async () => {
    const { updated } = await Ajax(signal).Buckets.notebook(namespace, bucketName, notebookName.slice(0, -6)).getObject()
    const tenMinutesAgo = _.tap(d => d.setMinutes(d.getMinutes() - 10), new Date())
    if (new Date(updated) > tenMinutesAgo) {
      notify('warn', 'This notebook has been edited recently', {
        message: 'If you recently edited this notebook, disregard this message. If another user is editing this notebook, your changes may be lost.',
        timeout: 30000
      })
    }
  }
  Utils.useOnMount(() => {
    localizeNotebook()
    checkRecentAccess()
  })
  return h(Fragment, [
    localized && h(Fragment, [
      iframe({
        src: `${clusterUrl}/notebooks/${name}/${notebookName}`,
        style: { border: 'none', flex: 1 },
        ref: frameRef
      }),
      h(JupyterFrameManager, {
        frameRef,
        onClose: () => Nav.goToPath('workspace-notebooks', { namespace, name })
      })
    ]),
    busy && h(StatusMessage, { showSpinner: true }, ['Copying notebook to runtime environment, almost ready...'])
  ])
}

const NotebookEditor = ({ notebookName, workspace, workspace: { workspace: { namespace } }, cluster, refreshClusters }) => {
  const signal = useCancellation()
  const [createOpen, setCreateOpen] = useState(false)
  const [startingCluster, setStartingCluster] = useState(false)
  // Status note: undefined means still loading, null means no cluster
  const clusterStatus = cluster && cluster.status
  const getCluster = Utils.useGetter(cluster)
  const startClusterOnce = _.flow(
    Utils.withBusyState(setStartingCluster),
    withErrorReporting('Error starting cluster')
  )(async () => {
    while (!signal.aborted) {
      const currentCluster = getCluster()
      const currentStatus = currentCluster && currentCluster.status
      if (currentStatus === 'Stopped') {
        await Ajax().Jupyter.cluster(namespace, currentCluster.clusterName).start()
        await refreshClusters()
        return
      } else if (currentStatus === undefined || currentStatus === 'Stopping') {
        await Utils.delay(500)
        continue
      } else {
        return
      }
    }
  })
  Utils.useOnMount(() => {
    startClusterOnce()
  })
  return h(Fragment, [
    Utils.switchCase(clusterStatus,
      ['Creating', () => h(StatusMessage, { showSpinner: true }, [
        'Creating notebook runtime environment, this will take 5-10 minutes. You can navigate away and return when it’s ready.'
      ])],
      ['Starting', () => h(StatusMessage, { showSpinner: true }, [
        'Starting notebook runtime environment, this may take up to 2 minutes.'
      ])],
      ['Stopping', () => h(StatusMessage, { showSpinner: true }, [
        'Notebook runtime environment is stopping. ',
        startingCluster ? 'It will be restarted after it finishes.' : 'You can restart it after it finishes.'
      ])],
      ['Stopped', () => startingCluster ?
        h(StatusMessage, { showSpinner: true }, ['Starting notebook runtime environment...']) :
        h(StatusMessage, ['Notebook runtime environment is stopped. Start it to edit your notebook.'])],
      ['Running', () => h(NotebookEditorFrame, { key: cluster.clusterName, workspace, cluster, notebookName })],
      ['Error', () => h(StatusMessage, ['Notebook runtime error.'])],
      [null, () => h(StatusMessage, [
        'You need a notebook runtime environment. ',
        h(Link, { onClick: () => setCreateOpen(true) }, ['Create one']),
        ' to get started.'
      ])]
    ),
    !_.includes(clusterStatus, ['Running', undefined]) && h(NotebookPreviewFrame, { notebookName, workspace }),
    createOpen && h(NewClusterModal, {
      namespace, currentCluster: cluster,
      onCancel: () => setCreateOpen(false),
      onSuccess: withErrorReporting('Error creating cluster', async promise => {
        setCreateOpen(false)
        await promise
        await refreshClusters()
      })
    })
  ])
}


export const navPaths = [
  {
    name: 'workspace-notebook-launch',
    path: '/workspaces/:namespace/:name/notebooks/launch/:notebookName',
    component: NotebookLauncher,
    title: ({ name, notebookName }) => `${notebookName} - ${name}`
  }
]
