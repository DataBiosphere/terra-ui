import * as clipboard from 'clipboard-polyfill'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { forwardRef, Fragment, useRef, useState } from 'react'
import { div, h, iframe, p, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { NewClusterModal } from 'src/components/ClusterManager'
import { ButtonPrimary, ButtonSecondary, Clickable, LabeledCheckbox, MenuButton } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { NotebookDuplicator } from 'src/components/notebook-utils'
import { notify } from 'src/components/Notifications'
import PopupTrigger from 'src/components/PopupTrigger'
import { Ajax, useCancellation } from 'src/libs/ajax'
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
  ({ queryParams = {}, notebookName, workspace, workspace: { namespace, name, accessLevel, canCompute }, cluster, refreshClusters, onRequesterPaysError }, ref) => {
    const [createOpen, setCreateOpen] = useState(false)
    // Status note: undefined means still loading, null means no cluster
    const clusterStatus = cluster && cluster.status

    return h(Fragment, [
      Utils.cond([
        !(Utils.canWrite(accessLevel) && canCompute), () => h(Fragment, [
          h(PreviewHeader, { cluster, refreshClusters, notebookName, workspace, readOnlyAccess: true }),
          h(NotebookPreviewFrame, { notebookName, workspace })
        ])
      ], [
        Utils.canWrite(accessLevel) && canCompute && queryParams['edit'] && clusterStatus === 'Running',
        () => h(NotebookEditorFrame, { key: cluster.clusterName, workspace, cluster, notebookName, mode: 'Edit' })
      ], [
        Utils.canWrite(accessLevel) && canCompute && queryParams['playground'] && clusterStatus === 'Running',
        () => h(NotebookEditorFrame, { key: cluster.clusterName, workspace, cluster, notebookName, mode: 'Playground' })
      ],
      () => h(Fragment, [
        h(PreviewHeader, { cluster, refreshClusters, notebookName, workspace, readOnlyAccess: false }),
        h(NotebookPreviewFrame, { notebookName, workspace })
      ])),
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
  })

const digestMessage = async message => {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const FileInUseModal = ({ onDismiss, onCopy, playgroundActions, namespace, name, bucketName, lockedBy, canShare }) => {
  const signal = useCancellation()
  const [lockedByEmail, setLockedByEmail] = useState(null)

  Utils.useOnMount(() => {
    const findLockedByEmail = async () => {
      const { acl } = await Ajax(signal).Workspaces.workspace(namespace, name).getAcl()
      const potentialLockers = _.flow(
        _.toPairs,
        _.map(([email, data]) => ({ email, ...data })),
        _.filter(({ accessLevel }) => _.includes(accessLevel, ['OWNER', 'PROJECT_OWNER', 'WRITER'])),
      )(acl)

      const currentLocker = _.find(
        _.identity,
        await Promise.all(_.map(async ({ email }) => {
          const hashedPotentialLocker = await digestMessage(`${bucketName}:${email}`)
          return (hashedPotentialLocker === lockedBy) && email
        }, potentialLockers))
      )
      setLockedByEmail(currentLocker || null)
    }
    if (canShare) {
      findLockedByEmail()
    }
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
        onClick: () => playgroundActions()
      }, ['RUN IN PLAYGROUND MODE'])
    ])
  ])
}

const PlaygroundModal = ({ onDismiss, playgroundActions }) => {
  const [userChoice, setUserChoice] = useState(false)
  return h(Modal, {
    width: 530,
    title: 'Playground Mode',
    onDismiss,
    okButton: h(ButtonPrimary,
      {
        onClick: () => {
          localStorage.setItem('hidePlaygroundModal', userChoice.toString())
          playgroundActions()
        }
      },
      'Continue')
  }, [
    `Playground mode allows you to explore, change, and run the code, but your edits will not be saved.`,
    div({ style: { flexGrow: 1 } }),
    'To save your work, choose Make a Copy from the File menu to make your own version.',
    h(LabeledCheckbox, {
      checked: userChoice === true,
      onChange: v => setUserChoice(v)
    }, [span({ style: { marginLeft: '0.5rem' } }, ['Do not show again '])])
  ])
}


const PreviewHeader = ({ cluster, readOnlyAccess, refreshClusters, notebookName, workspace, workspace: { canShare, workspace: { namespace, name, bucketName } } }) => {
  const signal = useCancellation()
  const { profile: { email } } = Utils.useAtom(authStore)
  const hidePlaygroundModal = localStorage.getItem('hidePlaygroundModal')
  const [createOpen, setCreateOpen] = useState(false)
  const [fileInUseOpen, setFileInUseOpen] = useState(false)
  const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState(null)
  const [exportingNotebookName, setExportingNotebookName] = useState()
  const [copyingNotebookName, setCopyingNotebookName] = useState()
  const clusterStatus = cluster && cluster.status
  const notebookLink = Nav.getLink('workspace-notebook-launch', { namespace, name, notebookName })

  const checkIfLocked = withErrorReporting('Error checking notebook lock status', async () => {
    const { metadata: { lastLockedBy, lockExpiresAt } } = await Ajax(signal).Buckets.notebook(namespace, bucketName, notebookName.slice(0, -6)).getObject()
    const hashedUser = await digestMessage(`${bucketName}:${email}`)
    const lockExpirationDate = new Date(parseInt(lockExpiresAt))

    if (lastLockedBy && (lastLockedBy !== hashedUser) && (lockExpirationDate > Date.now())) {
      setLocked(true)
      setLockedBy(lastLockedBy)
    }
  })

  Utils.useOnMount(() => { checkIfLocked() })

  const clusterActions = async (mode, clusterStatus) => {
    const choosePlaygroundMode = () => Nav.history.push({
      pathname: Nav.getPath('workspace-notebook-launch', { namespace, name, notebookName }),
      search: '?' + qs.stringify({ playground: 'true' })
    })
    const chooseEditMode = () => Nav.history.push({
      pathname: Nav.getPath('workspace-notebook-launch', { namespace, name, notebookName }),
      search: '?' + qs.stringify({ edit: 'true' })
    })
    if (mode === 'playground') {
      choosePlaygroundMode()
    } else {
      chooseEditMode()
    }
    if (clusterStatus === 'Stopped') {
      await Ajax().Jupyter.cluster(namespace, cluster.clusterName).start()
      await refreshClusters()
    } else if (clusterStatus === null) {
      setCreateOpen(true)
    }
  }

  return div({ style: { display: 'flex', alignItems: 'center', borderBottom: `2px solid ${colors.dark(0.2)}` } }, [
    div({ style: { fontSize: 18, fontWeight: 'bold', backgroundColor: colors.dark(0.2), paddingRight: '4rem', paddingLeft: '4rem', height: '100%', display: 'flex', alignItems: 'center' } },
      ['PREVIEW (READ-ONLY)']),
    Utils.cond(
      [
        !readOnlyAccess && clusterStatus === 'Creating', () => h(StatusMessage, { showSpinner: true }, [
          'Creating notebook runtime environment, this will take 5-10 minutes. You can navigate away and return when it’s ready.'
        ])
      ],
      [
        !readOnlyAccess && clusterStatus === 'Starting', () => h(StatusMessage, { showSpinner: true }, [
          'Starting notebook runtime environment, this may take up to 2 minutes.'
        ])
      ],
      [
        !readOnlyAccess && clusterStatus === 'Stopping', () => h(StatusMessage, { showSpinner: true }, [
          'Notebook runtime environment is stopping. You can restart it after it finishes.'
        ])
      ],
      [!readOnlyAccess && clusterStatus === 'Error', () => h(StatusMessage, ['Notebook runtime error.'])],
      [
        !readOnlyAccess && (clusterStatus === 'Running' || clusterStatus === 'Stopped' || clusterStatus === null),
        () => h(Fragment, [
          locked ? h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => setFileInUseOpen(true)
          }, [icon('lock', { style: { paddingRight: '3px' } }), 'EDIT (IN USE)']) : h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => clusterActions('edit', clusterStatus)
          }, [icon('edit', { style: { paddingRight: '3px' } }), 'EDIT']),
          h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: '2px' },
            onClick: () => {
              hidePlaygroundModal === 'true' ? clusterActions('playground', clusterStatus) : setPlaygroundModalOpen(true)
            }
          }, [icon('chalkboard', { style: { paddingRight: '3px' } }), 'PLAYGROUND MODE']),
          h(ButtonSecondary, {
            style: { paddingRight: '1rem', paddingLeft: '1rem', backgroundColor: colors.dark(0.1), height: '100%' }
          }, [
            h(PopupTrigger, {
              closeOnClick: true,
              content: h(Fragment, [
                h(MenuButton, { onClick: () => setCopyingNotebookName(notebookName) }, ['Make a Copy']),
                h(MenuButton, { onClick: () => setExportingNotebookName(notebookName) }, ['Copy to another workspace']),
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
              h(Clickable, { 'aria-label': 'Notebook options' }, [icon('ellipsis-v', {})])
            ])
          ])
        ])
      ]
    ),
    div({ style: { flexGrow: 1 } }),
    div({ style: { position: 'relative' } }, [
      h(Clickable, {
        'aria-label': 'Exit preview mode',
        style: { opacity: 0.65, marginRight: '1.5rem' },
        hover: { opacity: 1 }, focus: 'hover'
      }, [icon('times-circle', { size: 30 })])
    ]),
    createOpen && h(NewClusterModal, {
      namespace, currentCluster: cluster,
      onCancel: () => setCreateOpen(false),
      onSuccess: withErrorReporting('Error creating cluster', async promise => {
        setCreateOpen(false)
        await promise
        await refreshClusters()
      })
    }),
    fileInUseOpen && h(FileInUseModal, {
      namespace, name, lockedBy, canShare, bucketName,
      onDismiss: () => setFileInUseOpen(false),
      onCopy: () => setCopyingNotebookName(notebookName),
      playgroundActions: () => clusterActions('playground', clusterStatus)
    }),
    copyingNotebookName && h(NotebookDuplicator, {
      printName: copyingNotebookName.slice(0, -6),
      name, namespace, bucketName, destroyOld: false,
      onDismiss: () => setCopyingNotebookName(undefined),
      onSuccess: () => setCopyingNotebookName(undefined)
    }),
    exportingNotebookName && h(ExportNotebookModal, {
      printName: exportingNotebookName.slice(0, -6), workspace,
      onDismiss: () => setExportingNotebookName(undefined)
    }),
    playgroundModalOpen && h(PlaygroundModal, {
      onDismiss: () => setPlaygroundModalOpen(false),
      playgroundActions: () => {
        setPlaygroundModalOpen(false)
        clusterActions('playground', clusterStatus)
      }
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
  console.assert(status === 'Running', 'Expected cluster to be running')
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
    if (mode === 'Edit') {
      await Promise.all([
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).storageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, `.*\\.ipynb`),
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).lock(`${localBaseDirectory}/${notebookName}`),
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).localize([{
          sourceUri: `${cloudStorageDirectory}/${notebookName}`,
          localDestinationPath: `${localBaseDirectory}/${notebookName}`
        }]),
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).setCookie()
      ])
    } else {
      await Promise.all([
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).storageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, `.*\\.ipynb`),
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).localize([{
          sourceUri: `${cloudStorageDirectory}/${notebookName}`,
          localDestinationPath: `${localSafeModeBaseDirectory}/${notebookName}`
        }]),
        Ajax(signal).Jupyter.notebooks(namespace, clusterName).setCookie()
      ])
    }
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
        src: mode === 'Edit' ? `${clusterUrl}/notebooks/${localBaseDirectory}/${notebookName}`: `${clusterUrl}/notebooks/${localSafeModeBaseDirectory}/${notebookName}`,
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
