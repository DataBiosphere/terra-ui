import * as clipboard from 'clipboard-polyfill'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { forwardRef, Fragment, useEffect, useRef, useState } from 'react'
import { div, h, iframe, p, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { NewClusterModal } from 'src/components/ClusterManager'
import { ButtonPrimary, ButtonSecondary, Clickable, LabeledCheckbox, Link, MenuButton, spinnerOverlay } from 'src/components/common'
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
        h(Fragment, [
          cluster.labels.welderInstallFailed ? h(PlaygroundHeader, {}) : null,
          h(NotebookEditorFrame, { key: cluster.clusterName, workspace, cluster, notebookName, mode })
        ]) :
        h(Fragment, [
          h(PreviewHeader, { queryParams, cluster, refreshClusters, notebookName, workspace, readOnlyAccess: !(Utils.canWrite(accessLevel) && canCompute), onCreateCluster: () => setCreateOpen(true) }),
          h(NotebookPreviewFrame, { notebookName, workspace })
        ]),
      mode && h(ClusterKicker, { cluster, refreshClusters, onNullCluster: () => { setCreateOpen(true) } }),
      mode && h(ClusterStatusMonitor, { cluster, onClusterStoppedRunning: () => { chooseMode(undefined) } }),
      h(NewClusterModal, {
        isOpen: createOpen,
        namespace, currentCluster: cluster,
        onDismiss: () => {
          chooseMode(undefined)
          setCreateOpen(false)
        },
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

const EditModeDisabledModal = ({ onDismiss, onRecreateCluster, onPlayground }) => {
  return h(Modal, {
    width: 700,
    title: 'Cannot Edit Notebook',
    onDismiss,
    showButtons: false
  }, [
    p('We’ve released important updates that are not compatible with the older runtime associated with this workspace. To enable Edit Mode, please delete your existing runtime and create a new runtime.'),
    p('If you have any files on your old runtime that you want to keep, you can access your old runtime using the Playground Mode option.'),
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...Utils.newTabLinkProps
    }, ['Read here for more details.']),
    div({ style: { marginTop: '2rem' } }, [
      h(ButtonSecondary, {
        style: { paddingRight: '1rem', paddingLeft: '1rem' },
        onClick: () => onDismiss()
      }, ['CANCEL']),
      h(ButtonSecondary, {
        style: { paddingRight: '1rem', paddingLeft: '1rem', marginLeft: '1rem' },
        onClick: () => onPlayground()
      }, ['RUN IN PLAYGROUND MODE']),
      h(ButtonPrimary, {
        style: { paddingRight: '1rem', paddingLeft: '1rem', marginLeft: '2rem' },
        onClick: () => onRecreateCluster()
      }, ['RECREATE NOTEBOOK RUNTIME'])
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
          BrowserStorage.setLocalPref('hidePlaygroundMessage', hidePlaygroundMessage)
          onPlayground()
        }
      },
      'Continue')
  }, [
    p(['Playground mode allows you to explore, change, and run the code, but your edits will not be saved.']),
    p(['To save your work, choose ', span({ style: { fontWeight: 600 } }, ['Download ']), 'from the ', span({ style: { fontWeight: 600 } }, ['File ']), 'menu.']),
    h(LabeledCheckbox, {
      checked: hidePlaygroundMessage,
      onChange: v => setHidePlaygroundMessage(v)
    }, [span({ style: { marginLeft: '0.5rem' } }, ['Do not show again '])])
  ])
}

const PlaygroundHeader = () => {
  return div({ style: { backgroundColor: colors.warning(0.7), display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colors.dark(0.2)}`, height: '3.5rem', whiteSpace: 'pre' } }, [
    div({ style: { fontSize: 18, fontWeight: 'bold', backgroundColor: colors.warning(0.9), paddingRight: '4rem', paddingLeft: '4rem', height: '100%', display: 'flex', alignItems: 'center' } },
      ['PLAYGROUND MODE']),
    span({ style: { marginLeft: '2rem' } }, ['Edits to this notebook are ']),
    span({ style: { fontWeight: 'bold' } }, ['NOT ']),
    'being saved to the workspace. To save your changes, download the notebook using the file menu. ',
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...Utils.newTabLinkProps
    }, [' Read here for more details.'])
  ])
}


const PreviewHeader = ({ queryParams, cluster, readOnlyAccess, onCreateCluster, refreshClusters, notebookName, workspace, workspace: { canShare, workspace: { namespace, name, bucketName } } }) => {
  const signal = useCancellation()
  const { user: { email } } = Utils.useAtom(authStore)
  const [fileInUseOpen, setFileInUseOpen] = useState(false)
  const [editModeDisabledOpen, setEditModeDisabledOpen] = useState(false)
  const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState(null)
  const [exportingNotebook, setExportingNotebook] = useState(false)
  const [copyingNotebook, setCopyingNotebook] = useState(false)
  const clusterStatus = cluster && cluster.status
  const welderEnabled = cluster && !cluster.labels.welderInstallFailed
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
            onClick: () => welderEnabled ? (locked ? setFileInUseOpen(true) : chooseMode('edit')) : setEditModeDisabledOpen(true)
          }, [icon(welderEnabled ? (locked ? 'lock': 'edit') : 'warning-standard', { style: { paddingRight: '3px' } }), welderEnabled ? (locked ? 'EDIT (IN USE)' : 'EDIT') : 'EDIT (DISABLED)']),
          h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => {
              BrowserStorage.getLocalPref('hidePlaygroundMessage') ? chooseMode('playground') : setPlaygroundModalOpen(true)
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
    editModeDisabledOpen && h(EditModeDisabledModal, {
      onDismiss: () => setEditModeDisabledOpen(false),
      onRecreateCluster: () => {
        setEditModeDisabledOpen(false)
        onCreateCluster()
      },
      onPlayground: () => {
        setEditModeDisabledOpen(false)
        chooseMode('playground')
      }
    }),
    fileInUseOpen && h(FileInUseModal, {
      namespace, name, lockedBy, canShare, bucketName,
      onDismiss: () => setFileInUseOpen(false),
      onCopy: () => {
        setFileInUseOpen(false)
        setCopyingNotebook(true)
      },
      onPlayground: () => {
        setFileInUseOpen(false)
        chooseMode('playground')
      }
    }),
    copyingNotebook && h(NotebookDuplicator, {
      printName: notebookName.slice(0, -6), fromLauncher: true,
      name, namespace, bucketName, destroyOld: false,
      onDismiss: () => setCopyingNotebook(false),
      onSuccess: () => setCopyingNotebook(false)
    }),
    exportingNotebook && h(ExportNotebookModal, {
      printName: notebookName.slice(0, -6), workspace,
      fromLauncher: true,
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

const NotebookEditorFrame = ({ mode, notebookName, workspace: { workspace: { namespace, name, bucketName } }, cluster: { clusterName, clusterUrl, status, labels } }) => {
  console.assert(status === 'Running', 'Expected notebook runtime to be running')
  const frameRef = useRef()
  const signal = useCancellation()
  const [busy, setBusy] = useState(false)
  const [localized, setLocalized] = useState(false)
  const [notebookSetUp, setNotebookSetUp] = useState(false)

  const localBaseDirectory = `${name}/edit`
  const localSafeModeBaseDirectory = `${name}/safe`
  const cloudStorageDirectory = `gs://${bucketName}/notebooks`

  const localizeNotebook = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error copying notebook')
  )(async () => {
    if (mode === 'edit') {
      notify('error', 'Cannot Edit Notebook', {
        message: h(Fragment, [
          p(['Recent updates to Terra are not compatible with the older notebook runtime in this workspace. Please recreate your runtime in order to access Edit Mode for this notebook.']),
          h(Link, {
            variant: 'light',
            href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
            ...Utils.newTabLinkProps
          }, ['Read here for more details.'])
        ])
      })
      chooseMode(undefined)
      return
    }
    await Promise.all([
      Ajax(signal).Jupyter.notebooks(namespace, clusterName).oldLocalize({
        [`~/${name}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
      }),
      Ajax(signal).Jupyter.notebooks(namespace, clusterName).setCookie()
    ])
    setLocalized(true)
  })

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
        notify('error', 'Unable to Edit Notebook', {
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

  Utils.useOnMount(() => {
    if (labels.welderInstallFailed) {
      localizeNotebook()
    } else {
      setUpNotebook()
    }
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
