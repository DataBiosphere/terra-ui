import * as clipboard from 'clipboard-polyfill'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { forwardRef, Fragment, useEffect, useRef, useState } from 'react'
import { div, h, iframe, p, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { NewClusterModal } from 'src/components/ClusterManager'
import { ButtonPrimary, ButtonSecondary, Clickable, LabeledCheckbox, MenuButton, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { findPotentialNotebookLockers, NotebookDuplicator, notebookLockHash } from 'src/components/notebook-utils'
import { notify } from 'src/components/Notifications'
import PopupTrigger from 'src/components/PopupTrigger'
import { Ajax, useCancellation } from 'src/libs/ajax'
import * as BrowserStorage from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import ExportNotebookModal from 'src/pages/workspaces/workspace/notebooks/ExportNotebookModal'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const StatusMessage = ({ showSpinner, children }) => {
  return div({ style: { padding: '1.5rem 2rem', display: 'flex' } }, [
    showSpinner && spinner({ style: { marginRight: '0.5rem' } }),
    div([children])
  ])
}

const ClusterKicker = ({ cluster, refreshClusters, onNullCluster }) => {
  const getCluster = Utils.useGetter(cluster)
  const signal = useCancellation()
  const [busy, setBusy] = useState()

  const startClusterOnce = withErrorReporting('Error starting notebook runtime')(async () => {
    while (!signal.aborted) {
      const currentCluster = getCluster()
      const { status, googleProject, clusterName } = currentCluster || {}
      const currentStatus = currentCluster && status
      if (currentStatus === 'Stopped') {
        setBusy(true)
        await Ajax().Jupyter.cluster(googleProject, clusterName).start()
        await refreshClusters()
        setBusy(false)
        return
      } else if (currentStatus === undefined || currentStatus === 'Stopping') {
        await Utils.delay(500)
      } else if (currentStatus === null) {
        onNullCluster()
        return
      } else {
        return
      }
    }
  })

  Utils.useOnMount(() => {
    startClusterOnce()
  })

  return busy ? spinnerOverlay : null
}

const chooseMode = mode => {
  Nav.history.replace({ search: qs.stringify({ mode }) })
}

const ClusterStatusMonitor = ({ cluster, onClusterStoppedRunning }) => {
  const currentStatus = cluster && cluster.status
  const prevStatus = Utils.usePrevious(currentStatus)

  useEffect(() => {
    if (prevStatus === 'Running' && currentStatus !== 'Running') {
      onClusterStoppedRunning()
    }
  }, [currentStatus, onClusterStoppedRunning, prevStatus])

  return null
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
)(
  ({ queryParams = {}, notebookName, workspace, workspace: { workspace: { namespace, name }, accessLevel, canCompute }, cluster, refreshClusters, onRequesterPaysError }, ref) => {
    const [createOpen, setCreateOpen] = useState(false)
    // Status note: undefined means still loading, null means no cluster
    const clusterStatus = cluster && cluster.status
    const [busy, setBusy] = useState()
    const mode = queryParams['mode']

    return h(Fragment, [
      (Utils.canWrite(accessLevel) && canCompute && !!mode && clusterStatus === 'Running') ?
        h(NotebookEditorFrame, { key: cluster.clusterName, workspace, cluster, notebookName, mode }) :
        h(Fragment, [
          h(PreviewHeader, { queryParams, cluster, refreshClusters, notebookName, workspace, readOnlyAccess: !(Utils.canWrite(accessLevel) && canCompute) }),
          h(NotebookPreviewFrame, { notebookName, workspace })
        ]),
      mode && h(ClusterKicker, { cluster, refreshClusters, onNullCluster: () => { setCreateOpen(true) } }),
      mode && h(ClusterStatusMonitor, { cluster, onClusterStoppedRunning: () => { chooseMode(undefined) } }),
      createOpen && h(NewClusterModal, {
        namespace, currentCluster: cluster,
        onCancel: () => setCreateOpen(false),
        onSuccess: withErrorReporting('Error creating cluster', async promise => {
          setCreateOpen(false)
          setBusy(true)
          await promise
          await refreshClusters()
          setBusy(false)
        })
      }),
      busy && spinnerOverlay
    ])
  })

const FileInUseModal = ({ onDismiss, onCopy, onPlayground, namespace, name, bucketName, lockedBy, canShare }) => {
  const [lockedByEmail, setLockedByEmail] = useState(null)

  Utils.useOnMount(() => {
    const findLockedByEmail = withErrorReporting('Error loading locker information', async () => {
      const potentialLockers = await findPotentialNotebookLockers(canShare, namespace, name, bucketName)
      const currentLocker = potentialLockers[lockedBy]
      setLockedByEmail(currentLocker || null)
    })
    findLockedByEmail()
  })

  return h(Modal, {
    width: 530,
    title: 'Notebook Is In Use',
    onDismiss,
    showButtons: false
  }, [
    p(lockedByEmail ? `This notebook is currently being edited by ${lockedByEmail}.` : `This notebook is currently locked because another user is editing it.`),
    p('You can make a copy, or run it in Playground Mode to explore and execute its contents without saving any changes.'),
    div({ style: { marginTop: '2rem' } }, [
      h(ButtonSecondary, {
        style: { paddingRight: '1rem', paddingLeft: '1rem' },
        onClick: () => onDismiss()
      }, ['CANCEL']),
      h(ButtonSecondary, {
        style: { paddingRight: '1rem', paddingLeft: '1rem' },
        onClick: () => onCopy()
      }, ['MAKE A COPY']),
      h(ButtonPrimary, {
        onClick: () => onPlayground()
      }, ['RUN IN PLAYGROUND MODE'])
    ])
  ])
}

const PlaygroundModal = ({ onDismiss, onPlayground }) => {
  const [hidePlaygroundMessage, setHidePlaygroundMessage] = useState(false)
  return h(Modal, {
    width: 530,
    title: 'Playground Mode',
    onDismiss,
    okButton: h(ButtonPrimary,
      {
        onClick: () => {
          BrowserStorage.setLocalPref('hidePlaygroundMessage2', hidePlaygroundMessage)
          onPlayground()
        }
      },
      'Continue')
  }, [
    p(`Playground mode allows you to explore, change, and run the code, but your edits will not be saved.`),
    div({ style: { flexGrow: 1 } }),
    p('To save your work, choose Make a Copy from the File menu to make your own version.'),
    div({ style: { flexGrow: 1 } }),
    h(LabeledCheckbox, {
      checked: hidePlaygroundMessage,
      onChange: v => setHidePlaygroundMessage(v)
    }, [span({ style: { marginLeft: '0.5rem' } }, ['Do not show again '])])
  ])
}


const PreviewHeader = ({ queryParams, cluster, readOnlyAccess, refreshClusters, notebookName, workspace, workspace: { canShare, workspace: { namespace, name, bucketName } } }) => {
  const signal = useCancellation()
  const { profile: { email } } = Utils.useAtom(authStore)
  const [fileInUseOpen, setFileInUseOpen] = useState(false)
  const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState(null)
  const [exportingNotebook, setExportingNotebook] = useState(false)
  const [copyingNotebook, setCopyingNotebook] = useState(false)
  const clusterStatus = cluster && cluster.status
  const mode = queryParams['mode']
  const notebookLink = Nav.getLink('workspace-notebook-launch', { namespace, name, notebookName })

  const checkIfLocked = withErrorReporting('Error checking notebook lock status', async () => {
    const { metadata } = await Ajax(signal).Buckets.notebook(namespace, bucketName, notebookName.slice(0, -6)).getObject()
    const { lastLockedBy, lockExpiresAt } = metadata || {}
    const hashedUser = await notebookLockHash(bucketName, email)
    const lockExpirationDate = new Date(parseInt(lockExpiresAt))

    if (lastLockedBy && (lastLockedBy !== hashedUser) && (lockExpirationDate > Date.now())) {
      setLocked(true)
      setLockedBy(lastLockedBy)
    }
  })

  Utils.useOnMount(() => { checkIfLocked() })

  return div({ style: { display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colors.dark(0.2)}`, height: '3.5rem' } }, [
    div({ style: { fontSize: 18, fontWeight: 'bold', backgroundColor: colors.dark(0.2), paddingRight: '4rem', paddingLeft: '4rem', height: '100%', display: 'flex', alignItems: 'center' } },
      ['PREVIEW (READ-ONLY)']),
    !readOnlyAccess && Utils.cond(
      [
        !mode || clusterStatus === null || clusterStatus === 'Stopped', () => h(Fragment, [
          h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => locked ? setFileInUseOpen(true) : chooseMode('edit')
          }, [icon(locked ? 'lock': 'edit', { style: { paddingRight: '3px' } }), locked ? 'EDIT (IN USE)' : 'EDIT']),
          h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => {
              BrowserStorage.getLocalPref('hidePlaygroundMessage2') ? chooseMode('playground') : setPlaygroundModalOpen(true)
            }
          }, [icon('chalkboard', { style: { paddingRight: '3px' } }), 'PLAYGROUND MODE']),
          h(PopupTrigger, {
            closeOnClick: true,
            content: h(Fragment, [
              h(MenuButton, { onClick: () => setCopyingNotebook(true) }, ['Make a Copy']),
              h(MenuButton, { onClick: () => setExportingNotebook(true) }, ['Copy to another workspace']),
              h(MenuButton, {
                onClick: async () => {
                  try {
                    await clipboard.writeText(`${window.location.host}/${notebookLink}`)
                    notify('success', 'Successfully copied URL to clipboard', { timeout: 3000 })
                  } catch (error) {
                    reportError('Error copying to clipboard', error)
                  }
                }
              }, ['Copy URL to clipboard'])
            ]),
            side: 'bottom'
          }, [
            h(ButtonSecondary, {
              style: { paddingRight: '1rem', paddingLeft: '1rem', backgroundColor: colors.dark(0.1), height: '100%' }
            }, [icon('ellipsis-v', {})])
          ])
        ])
      ],
      [
        clusterStatus === 'Creating', () => h(StatusMessage, { showSpinner: true }, [
          'Creating notebook runtime environment, this will take 5-10 minutes. You can navigate away and return when it’s ready.'
        ])
      ],
      [
        clusterStatus === 'Starting', () => h(StatusMessage, { showSpinner: true }, [
          'Starting notebook runtime environment, this may take up to 2 minutes.'
        ])
      ],
      [
        clusterStatus === 'Stopping', () => h(StatusMessage, { showSpinner: true }, [
          'Notebook runtime environment is stopping. You can restart it after it finishes.'
        ])
      ],
      [clusterStatus === 'Error', () => h(StatusMessage, ['Notebook runtime error.'])]
    ),
    div({ style: { flexGrow: 1 } }),
    div({ style: { position: 'relative' } }, [
      h(Clickable, {
        'aria-label': 'Exit preview mode',
        style: { opacity: 0.65, marginRight: '1.5rem' },
        hover: { opacity: 1 }, focus: 'hover',
        onClick: () => Nav.goToPath('workspace-notebooks', { namespace, name })
      }, [icon('times-circle', { size: 30 })])
    ]),
    fileInUseOpen && h(FileInUseModal, {
      namespace, name, lockedBy, canShare, bucketName,
      onDismiss: () => setFileInUseOpen(false),
      onCopy: () => setCopyingNotebook(true),
      onPlayground: () => chooseMode('playground')
    }),
    copyingNotebook && h(NotebookDuplicator, {
      printName: notebookName.slice(0, -6),
      name, namespace, bucketName, destroyOld: false,
      onDismiss: () => setCopyingNotebook(false),
      onSuccess: () => setCopyingNotebook(false)
    }),
    exportingNotebook && h(ExportNotebookModal, {
      printName: notebookName.slice(0, -6), workspace,
      onDismiss: () => setExportingNotebook(false)
    }),
    playgroundModalOpen && h(PlaygroundModal, {
      onDismiss: () => setPlaygroundModalOpen(false),
      onPlayground: () => {
        setPlaygroundModalOpen(false)
        chooseMode('playground')
      }
    })
  ])
}

const NotebookPreviewFrame = ({ notebookName, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError }) => {
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

const NotebookEditorFrame = ({ mode, notebookName, workspace: { workspace: { namespace, name, bucketName } }, cluster: { clusterName, clusterUrl, status } }) => {
  console.assert(status === 'Running', 'Expected notebook runtime to be running')
  const signal = useCancellation()
  const frameRef = useRef()
  const [busy, setBusy] = useState(false)
  const [notebookSetUp, setNotebookSetUp] = useState(false)

  const localBaseDirectory = `${name}/edit`
  const localSafeModeBaseDirectory = `${name}/safe`
  const cloudStorageDirectory = `gs://${bucketName}/notebooks`

  const setUpNotebook = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error setting up notebook')
  )(async () => {
    await Ajax()
      .Jupyter
      .notebooks(namespace, clusterName)
      .storageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, `.*\\.ipynb`)
    if (mode === 'edit') {
      const lockSuccessful = await Ajax().Jupyter.notebooks(namespace, clusterName).lock(`${localBaseDirectory}/${notebookName}`)
      if (!lockSuccessful) {
        notify('error', 'Unable to Lock Notebook', {
          message: 'Another user is currently editing this notebook. You can run it in Playground Mode or make a copy.'
        })
        chooseMode(undefined)
        return
      }
    }
    await Promise.all([
      Ajax().Jupyter.notebooks(namespace, clusterName).localize([{
        sourceUri: `${cloudStorageDirectory}/${notebookName}`,
        localDestinationPath: mode === 'edit' ? `${localBaseDirectory}/${notebookName}` : `${localSafeModeBaseDirectory}/${notebookName}`
      }]),
      Ajax().Jupyter.notebooks(namespace, clusterName).setCookie()
    ])
    setNotebookSetUp(true)
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
    setUpNotebook()
    checkRecentAccess()
  })

  return h(Fragment, [
    notebookSetUp && h(Fragment, [
      iframe({
        src: mode === 'edit' ? `${clusterUrl}/notebooks/${localBaseDirectory}/${notebookName}`: `${clusterUrl}/notebooks/${localSafeModeBaseDirectory}/${notebookName}`,
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

export const navPaths = [
  {
    name: 'workspace-notebook-launch',
    path: '/workspaces/:namespace/:name/notebooks/launch/:notebookName',
    component: NotebookLauncher,
    title: ({ name, notebookName }) => `${notebookName} - ${name}`
  }
]
