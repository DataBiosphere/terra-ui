import * as clipboard from 'clipboard-polyfill/text'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { Fragment, useRef, useState } from 'react'
import { b, div, h, iframe, p, span } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ButtonPrimary, ButtonSecondary, Clickable, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { dataSyncingDocUrl } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { getLocalPref, setLocalPref } from 'src/libs/prefs'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore, cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import {
  findPotentialNotebookLockers, getFileName, notebookLockHash
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { AnalysisDuplicator } from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator'
import { ComputeModal } from 'src/pages/workspaces/workspace/analysis/modals/ComputeModal'
import ExportAnalysisModal from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal'
import {
  analysisLauncherTabName, analysisTabName, appLauncherTabName, ApplicationHeader, PlaygroundHeader, RuntimeKicker, RuntimeStatusMonitor,
  StatusMessage
} from 'src/pages/workspaces/workspace/analysis/runtime-common'
import {
  getConvertedRuntimeStatus, getCurrentPersistentDisk, getCurrentRuntime, usableStatuses
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import {
  getPatternFromRuntimeTool, getToolFromFileExtension, getToolFromRuntime, toolLabels
} from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'

import { AzureComputeModal } from './modals/AzureComputeModal'


const chooseMode = mode => {
  Nav.history.replace({ search: qs.stringify({ mode }) })
}

const AnalysisLauncher = _.flow(
  forwardRefWithName('AnalysisLauncher'),
  requesterPaysWrapper({
    onDismiss: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
  }),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceTab(props, 'analyses'),
    title: _.get('analysisName'),
    activeTab: analysisLauncherTabName
  })
)(
  ({
    queryParams, analysisName, workspace, workspace: { accessLevel, canCompute },
    analysesData: { runtimes, refreshRuntimes, persistentDisks, location }
  }, _ref) => {
    const [createOpen, setCreateOpen] = useState(false)
    const currentRuntime = getCurrentRuntime(runtimes)
    const currentDisk = getCurrentPersistentDisk(runtimes, persistentDisks)
    const { runtimeName, labels } = currentRuntime || {}
    const status = getConvertedRuntimeStatus(currentRuntime)
    const [busy, setBusy] = useState()
    const { mode } = queryParams
    //note that here, the file tool is either Jupyter or RStudio, and cannot be azure (as .ipynb extensions are used for azure as well)
    //hence, currentRuntimeTool is not always currentFileToolLabel
    const currentFileToolLabel = getToolFromFileExtension(analysisName)
    const currentRuntimeTool = getToolFromRuntime(currentRuntime)
    const iframeStyles = { height: '100%', width: '100%' }
    const isAzureWorkspace = !!workspace.azureContext

    useOnMount(() => {
      refreshRuntimes()
    })

    return h(Fragment, [
      div({ style: { flex: 1, display: 'flex' } }, [
        div({ style: { flex: 1 } }, [
          (Utils.canWrite(accessLevel) && canCompute && !!mode && _.includes(status, usableStatuses) && currentRuntimeTool === 'Jupyter') ?
            h(labels?.welderInstallFailed ? WelderDisabledNotebookEditorFrame : AnalysisEditorFrame,
              { key: runtimeName, workspace, runtime: currentRuntime, analysisName, mode, toolLabel: currentFileToolLabel, styles: iframeStyles }) :
            h(Fragment, [
              h(PreviewHeader, {
                styles: iframeStyles, queryParams, runtime: currentRuntime, analysisName, currentFileToolLabel, workspace, setCreateOpen, refreshRuntimes,
                readOnlyAccess: !(Utils.canWrite(accessLevel) && canCompute)
              }),
              h(AnalysisPreviewFrame, { styles: iframeStyles, analysisName, toolLabel: currentFileToolLabel, workspace })
            ])
        ]),
        mode && h(RuntimeKicker, { runtime: currentRuntime, refreshRuntimes }),
        mode && h(RuntimeStatusMonitor, { runtime: currentRuntime }),
        h(ComputeModal, {
          isOpen: createOpen && !isAzureWorkspace,
          tool: currentFileToolLabel,
          shouldHideCloseButton: false,
          workspace,
          currentRuntime,
          currentDisk,
          location,
          onDismiss: () => {
            chooseMode(undefined)
            setCreateOpen(false)
          },
          onSuccess: _.flow(
            withErrorReporting('Error creating cloud compute'),
            Utils.withBusyState(setBusy)
          )(async () => {
            setCreateOpen(false)
            await refreshRuntimes(true)
          })
        }),
        h(AzureComputeModal, {
          isOpen: createOpen && isAzureWorkspace,
          hideCloseButton: true,
          workspace,
          runtimes,
          onDismiss: () => {
            chooseMode(undefined)
            setCreateOpen(false)
          },
          onSuccess: _.flow(
            withErrorReporting('Error creating cloud compute'),
            Utils.withBusyState(setBusy)
          )(async () => {
            setCreateOpen(false)
            await refreshRuntimes(true)
          }),
          onError: () => {
            chooseMode(undefined)
            setCreateOpen(false)
          }
        }),
        busy && spinnerOverlay
      ])
    ])
  })

const FileInUseModal = ({ onDismiss, onCopy, onPlayground, namespace, name, bucketName, lockedBy, canShare }) => {
  const [lockedByEmail, setLockedByEmail] = useState()

  useOnMount(() => {
    const findLockedByEmail = withErrorReporting('Error loading locker information', async () => {
      const potentialLockers = await findPotentialNotebookLockers({ canShare, namespace, workspaceName: name, bucketName })
      const currentLocker = potentialLockers[lockedBy]
      setLockedByEmail(currentLocker)
    })
    findLockedByEmail()
  })

  return h(Modal, {
    width: 530,
    title: 'Notebook Is In Use',
    onDismiss,
    showButtons: false
  }, [
    p(lockedByEmail ?
      `This notebook is currently being edited by ${lockedByEmail}.` :
      'This notebook is currently locked because another user is editing it.'),
    p('You can make a copy, or run it in Playground Mode to explore and execute its contents without saving any changes.'),
    div({ style: { marginTop: '2rem' } }, [
      h(ButtonSecondary, {
        style: { padding: '0 1rem' },
        onClick: () => onDismiss()
      }, ['Cancel']),
      h(ButtonSecondary, {
        style: { padding: '0 1rem' },
        onClick: () => onCopy()
      }, ['Make a copy']),
      h(ButtonPrimary, {
        onClick: () => onPlayground()
      }, ['Run in playground mode'])
    ])
  ])
}

const EditModeDisabledModal = ({ onDismiss, onRecreateRuntime, onPlayground }) => {
  return h(Modal, {
    width: 700,
    title: 'Cannot Edit Notebook',
    onDismiss,
    showButtons: false
  }, [
    p('We’ve released important updates that are not compatible with the older cloud environment associated with this workspace. To enable Edit Mode, please delete your existing cloud environment and create a new cloud environment.'),
    p('If you have any files on your old cloud environment that you want to keep, you can access your old cloud environment using the Playground Mode option.'),
    h(Link, {
      'aria-label': 'Data syncing doc',
      href: dataSyncingDocUrl,
      ...Utils.newTabLinkProps
    }, ['Read here for more details.']),
    div({ style: { marginTop: '2rem' } }, [
      h(ButtonSecondary, {
        'aria-label': 'Launcher dismiss',
        style: { padding: '0 1rem' },
        onClick: () => onDismiss()
      }, ['Cancel']),
      h(ButtonSecondary, {
        'aria-label': 'Launcher playground',
        style: { padding: '0 1rem', marginLeft: '1rem' },
        onClick: () => onPlayground()
      }, ['Run in playground mode']),
      h(ButtonPrimary, {
        'aria-label': 'Launcher create',
        style: { padding: '0 1rem', marginLeft: '2rem' },
        onClick: () => onRecreateRuntime()
      }, ['Recreate cloud environment'])
    ])
  ])
}

const PlaygroundModal = ({ onDismiss, onPlayground }) => {
  const [hidePlaygroundMessage, setHidePlaygroundMessage] = useState(false)
  return h(Modal, {
    width: 530,
    title: 'Playground Mode',
    onDismiss,
    okButton: h(ButtonPrimary, {
      onClick: () => {
        setLocalPref('hidePlaygroundMessage', hidePlaygroundMessage)
        onPlayground()
      }
    },
    'Continue')
  }, [
    p(['Playground mode allows you to explore, change, and run the code, but your edits will not be saved.']),
    p(['To save your work, choose ', span({ style: { fontWeight: 600 } }, ['Download ']), 'from the ',
      span({ style: { fontWeight: 600 } }, ['File ']), 'menu.']),
    h(LabeledCheckbox, {
      checked: hidePlaygroundMessage,
      onChange: setHidePlaygroundMessage
    }, [span({ style: { marginLeft: '0.5rem' } }, ['Do not show again '])])
  ])
}

const HeaderButton = ({ children, ...props }) => h(ButtonSecondary, {
  'aria-label': 'analysis header button',
  style: { padding: '1rem', backgroundColor: colors.dark(0.1), height: '100%', marginRight: 2 }, ...props
}, [children])

// This component is responsible for generating the preview/open header bar above the iframe content
const PreviewHeader = ({
  queryParams, runtime, readOnlyAccess, onCreateRuntime, analysisName, currentFileToolLabel, workspace, setCreateOpen, refreshRuntimes,
  workspace: { canShare, workspace: { namespace, name, bucketName, googleProject, workspaceId } }
}) => {
  const signal = useCancellation()
  const { user: { email } } = useStore(authStore)
  const [fileInUseOpen, setFileInUseOpen] = useState(false)
  const [editModeDisabledOpen, setEditModeDisabledOpen] = useState(false)
  const [playgroundModalOpen, setPlaygroundModalOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState(null)
  const [exportingAnalysis, setExportingAnalysis] = useState(false)
  const [copyingAnalysis, setCopyingAnalysis] = useState(false)
  const runtimeStatus = getConvertedRuntimeStatus(runtime)
  const welderEnabled = runtime && !runtime.labels?.welderInstallFailed
  const { mode } = queryParams
  const analysisLink = Nav.getLink(analysisLauncherTabName, { namespace, name, analysisName })
  const isAzureWorkspace = !!workspace.azureContext
  const currentRuntimeTool = getToolFromRuntime(runtime)

  const checkIfLocked = withErrorReporting('Error checking analysis lock status', async () => {
    const { metadata: { lastLockedBy, lockExpiresAt } = {} } = await Ajax(signal)
      .Buckets
      .analysis(googleProject, bucketName, getFileName(analysisName), currentFileToolLabel)
      .getObject()
    const hashedUser = await notebookLockHash(bucketName, email)
    const lockExpirationDate = new Date(parseInt(lockExpiresAt))

    if (lastLockedBy && (lastLockedBy !== hashedUser) && (lockExpirationDate > Date.now())) {
      setLocked(true)
      setLockedBy(lastLockedBy)
    }
  })

  const startAndRefresh = withErrorReporting('Error starting compute', async (refreshRuntimes, runtime) => {
    await Ajax().Runtimes.runtimeWrapper(runtime).start()
    await refreshRuntimes(true)
  })

  useOnMount(() => {
    if (!!googleProject) {
      checkIfLocked()
    }
  })

  const openMenuIcon = [makeMenuIcon('rocket'), 'Open']

  const createNewRuntimeOpenButton = h(HeaderButton, {
    onClick: () => setCreateOpen(true)
  },
  openMenuIcon)

  const editModeButton = h(HeaderButton, { onClick: () => chooseMode('edit') }, openMenuIcon)

  return h(ApplicationHeader, {
    label: 'PREVIEW (READ-ONLY)',
    labelBgColor: colors.dark(0.2)
  }, [
    // App-specific controls
    Utils.cond(
      [readOnlyAccess, () => h(HeaderButton, { onClick: () => setExportingAnalysis(true) }, [
        makeMenuIcon('export'), 'Copy to another workspace'
      ])],
      [!runtime, () => createNewRuntimeOpenButton],
      [runtimeStatus === 'Stopped', () => h(HeaderButton, {
        onClick: () => startAndRefresh(refreshRuntimes, runtime)
      }, openMenuIcon)],
      [isAzureWorkspace && _.includes(runtimeStatus, usableStatuses) && currentFileToolLabel === toolLabels.Jupyter,
        () => h(HeaderButton, {
          onClick: () => {
            Ajax().Metrics.captureEvent(Events.analysisLaunch,
              { origin: 'analysisLauncher', source: currentRuntimeTool, application: currentRuntimeTool, workspaceName: name, namespace })
            Nav.goToPath(appLauncherTabName, { namespace, name, application: currentRuntimeTool })
          }
        }, openMenuIcon)],
      [isAzureWorkspace && runtimeStatus !== 'Running', () => {}],
      // Azure logic must come before this branch, as currentRuntimeTool !== currentFileToolLabel for azure.

      [currentRuntimeTool !== currentFileToolLabel, () => createNewRuntimeOpenButton],
      // If the tool is RStudio and we are in this branch, we need to either start an existing runtime or launch the app
      // Worth mentioning that the Stopped branch will launch RStudio, and then we depend on the RuntimeManager to prompt user the app is ready to launch
      // Then open can be clicked again
      [currentFileToolLabel === toolLabels.RStudio && _.includes(runtimeStatus, ['Running', null]),
        () => h(HeaderButton, {
          onClick: () => {
            if (runtimeStatus === 'Running') {
              Ajax().Metrics.captureEvent(Events.analysisLaunch,
                { origin: 'analysisLauncher', source: toolLabels.RStudio, application: toolLabels.RStudio, workspaceName: name, namespace })
              Nav.goToPath(appLauncherTabName, { namespace, name, application: 'RStudio' })
            }
          }
        },
        openMenuIcon)],
      // Jupyter is slightly different since it interacts with editMode and playground mode flags as well. This is not applicable to jupyter apps in azure or JupyterLab in GCP
      [(currentRuntimeTool === toolLabels.Jupyter && !mode) || [null, 'Stopped'].includes(runtimeStatus), () => h(Fragment, [
        Utils.cond(
          [runtime && !welderEnabled, () => h(HeaderButton, { onClick: () => setEditModeDisabledOpen(true) }, [
            makeMenuIcon('warning-standard'), 'Open (Disabled)'
          ])],
          [locked, () => h(HeaderButton, { onClick: () => setFileInUseOpen(true) }, [
            makeMenuIcon('lock'), 'Open (In use)'
          ])],
          () => editModeButton
        ),
        h(HeaderButton, {
          onClick: () => getLocalPref('hidePlaygroundMessage') ? chooseMode('playground') : setPlaygroundModalOpen(true)
        }, [
          makeMenuIcon('chalkboard'), 'Playground mode'
        ])
      ])]
    ),
    // Workspace-level options
    h(MenuTrigger, {
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, { 'aria-label': 'Copy analysis', onClick: () => setCopyingAnalysis(true) }, ['Make a Copy']),
        h(MenuButton, { onClick: () => setExportingAnalysis(true) }, ['Copy to another workspace']),
        h(MenuButton, {
          onClick: withErrorReporting('Error copying to clipboard', async () => {
            await clipboard.writeText(`${window.location.host}/${analysisLink}`)
            notify('success', 'Successfully copied URL to clipboard', { timeout: 3000 })
          })
        }, ['Copy URL to clipboard'])
      ]),
      side: 'bottom'
    }, [
      h(HeaderButton, {}, [icon('ellipsis-v')])
    ]),
    // Status specific messaging which is not specific to an app
    Utils.cond(
      [_.includes(runtimeStatus, usableStatuses), () => h(StatusMessage, { hideSpinner: true }, [
        'Cloud environment is ready.'
      ])],
      [runtimeStatus === 'Creating', () => h(StatusMessage, [
        'Creating cloud environment. You can navigate away and return in 3-5 minutes.'
      ])],
      [runtimeStatus === 'Starting', () => h(StatusMessage, [
        'Starting cloud environment, this may take up to 2 minutes.'
      ])],
      [runtimeStatus === 'Stopping', () => h(StatusMessage, [
        'Cloud environment is stopping, which takes ~4 minutes. It will restart after this finishes.'
      ])],
      [runtimeStatus === 'LeoReconfiguring', () => h(StatusMessage, [
        'Cloud environment is updating, please wait.'
      ])],
      [runtimeStatus === 'Error', () => h(StatusMessage, { hideSpinner: true }, ['Cloud environment error.'])]
    ),
    div({ style: { flexGrow: 1 } }),
    div({ style: { position: 'relative' } }, [
      h(Clickable, {
        'aria-label': 'Exit preview mode',
        style: { opacity: 0.65, marginRight: '1.5rem' },
        hover: { opacity: 1 }, focus: 'hover',
        onClick: () => Nav.goToPath(analysisTabName, { namespace, name })
      }, [icon('times-circle', { size: 30 })])
    ]),
    editModeDisabledOpen && h(EditModeDisabledModal, {
      onDismiss: () => setEditModeDisabledOpen(false),
      onRecreateRuntime: () => {
        setEditModeDisabledOpen(false)
        onCreateRuntime()
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
        setCopyingAnalysis(true)
      },
      onPlayground: () => {
        setFileInUseOpen(false)
        chooseMode('playground')
      }
    }),
    copyingAnalysis && h(AnalysisDuplicator, {
      printName: getFileName(analysisName),
      toolLabel: getToolFromFileExtension(analysisName),
      fromLauncher: true,
      workspaceName: name, googleProject, workspaceId, namespace, bucketName, destroyOld: false,
      onDismiss: () => setCopyingAnalysis(false),
      onSuccess: () => setCopyingAnalysis(false)
    }),
    exportingAnalysis && h(ExportAnalysisModal, {
      printName: getFileName(analysisName),
      toolLabel: getToolFromFileExtension(analysisName), workspace,
      fromLauncher: true,
      onDismiss: () => setExportingAnalysis(false)
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

// This component is responsible for rendering the html preview of the analysis file
const AnalysisPreviewFrame = ({ analysisName, toolLabel, workspace: { workspace: { workspaceId, googleProject, bucketName } }, onRequesterPaysError, styles }) => {
  const signal = useCancellation()
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState()
  const frame = useRef()

  const loadPreview = _.flow(
    Utils.withBusyState(setBusy),
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error previewing analysis')
  )(async () => {
    const previewHtml = !!googleProject ?
      await Ajax(signal).Buckets.analysis(googleProject, bucketName, analysisName, toolLabel).preview() :
      await Ajax(signal).AzureStorage.blob(workspaceId, analysisName).preview()
    setPreview(previewHtml)
  })
  useOnMount(() => {
    loadPreview()
  })

  return h(Fragment, [
    preview && h(Fragment, [
      iframe({
        ref: frame,
        onLoad: () => {
          const doc = frame.current.contentWindow.document
          doc.head.appendChild(Utils.createHtmlElement(doc, 'base', Utils.newTabLinkProps))
          doc.addEventListener('mousedown', () => window.document.dispatchEvent(new MouseEvent('mousedown')))
        },
        style: { border: 'none', flex: 1, ...styles },
        srcDoc: preview,
        title: 'Preview for analysis'
      })
    ]),
    busy && div({ style: { margin: '0.5rem 2rem' } }, ['Generating preview...'])
  ])
}

// This is the purely functional component
// It is in charge of ensuring that navigating away from the Jupyter iframe results in a save via a custom extension located in `jupyter-iframe-extension`
// See this ticket for RStudio impl discussion: https://broadworkbench.atlassian.net/browse/IA-2947
const JupyterFrameManager = ({ onClose, frameRef, details = {} }) => {
  useOnMount(() => {
    Ajax()
      .Metrics
      .captureEvent(Events.analysisLaunch,
        { source: toolLabels.Jupyter, application: toolLabels.Jupyter, workspaceName: details.name, namespace: details.namespace })

    const isSaved = Utils.atom(true)
    const onMessage = e => {
      switch (e.data) {
        case 'close':
          return onClose()
        case 'saved':
          return isSaved.set(true)
        case 'dirty':
          return isSaved.set(false)
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

const copyingAnalysisMessage = div({ style: { paddingTop: '2rem' } }, [
  h(StatusMessage, ['Copying analysis to cloud environment, almost ready...'])
])

const AnalysisEditorFrame = ({
  styles, mode, analysisName, toolLabel, workspace: { workspace: { googleProject, namespace, name, bucketName } },
  runtime: { runtimeName, proxyUrl, status, labels }
}) => {
  console.assert(_.includes(status, usableStatuses), `Expected cloud environment to be one of: [${usableStatuses}]`)
  console.assert(!labels.welderInstallFailed, 'Expected cloud environment to have Welder')
  const frameRef = useRef()
  const [busy, setBusy] = useState(false)
  const [analysisSetupComplete, setAnalysisSetupComplete] = useState(false)
  const cookieReady = useStore(cookieReadyStore)

  const localBaseDirectory = Utils.switchCase(toolLabel,
    [toolLabels.Jupyter, () => `${name}/edit`],
    [toolLabels.JupyterLab, () => ''],
    [toolLabels.RStudio, () => ''])

  const localSafeModeBaseDirectory = Utils.switchCase(toolLabel,
    [toolLabels.Jupyter, () => `${name}/safe`],
    [toolLabels.RStudio, () => '']
  )

  useOnMount(() => {
    const cloudStorageDirectory = `gs://${bucketName}/notebooks`

    const setUpAnalysis = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error setting up analysis')
    )(async () => {
      await Ajax()
        .Runtimes
        .fileSyncing(googleProject, runtimeName)
        .setStorageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, getPatternFromRuntimeTool(toolLabel))

      if (mode === 'edit' && !(await Ajax().Runtimes.fileSyncing(googleProject, runtimeName).lock(`${localBaseDirectory}/${analysisName}`))) {
        notify('error', 'Unable to Edit Analysis', {
          message: 'Another user is currently editing this analysis. You can run it in Playground Mode or make a copy.'
        })
        chooseMode(undefined)
      } else {
        await Ajax().Runtimes.fileSyncing(googleProject, runtimeName).localize([{
          sourceUri: `${cloudStorageDirectory}/${analysisName}`,
          localDestinationPath: mode === 'edit' ? `${localBaseDirectory}/${analysisName}` : `${localSafeModeBaseDirectory}/${analysisName}`
        }])
        setAnalysisSetupComplete(true)
      }
    })

    setUpAnalysis()
  })

  return h(Fragment, [
    analysisSetupComplete && cookieReady && h(Fragment, [
      iframe({
        id: 'analysis-iframe',
        src: `${proxyUrl}/notebooks/${mode === 'edit' ? localBaseDirectory : localSafeModeBaseDirectory}/${analysisName}`,
        style: { border: 'none', flex: 1, ...styles },
        ref: frameRef
      }),
      h(JupyterFrameManager, {
        frameRef,
        onClose: () => Nav.goToPath(analysisTabName, { namespace, name }),
        details: { analysisName, name, namespace }
      })
    ]),
    busy && copyingAnalysisMessage
  ])
}

//TODO: this originally was designed to handle VMs that didn't have welder deployed on them
// do we need this anymore? (can be queried in prod DB to see if there are any VMs with welderEnabled=false with a `recent` dateAccessed
// do we need to support this for rstudio? I don't think so because welder predates RStudio support, but not 100%
const WelderDisabledNotebookEditorFrame = ({
  styles, mode, notebookName, workspace: { workspace: { googleProject, namespace, name, bucketName } },
  runtime: { runtimeName, proxyUrl, status, labels }
}) => {
  console.assert(status === 'Running', 'Expected cloud environment to be running')
  console.assert(!!labels.welderInstallFailed, 'Expected cloud environment to not have Welder')
  const frameRef = useRef()
  const signal = useCancellation()
  const [busy, setBusy] = useState(false)
  const [localized, setLocalized] = useState(false)
  const cookieReady = useStore(cookieReadyStore)

  const localizeNotebook = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error copying notebook')
  )(async () => {
    if (mode === 'edit') {
      notify('error', 'Cannot Edit Notebook', {
        message: h(Fragment, [
          p(['Recent updates to Terra are not compatible with the older cloud environment in this workspace. Please recreate your cloud environment in order to access Edit Mode for this notebook.']),
          h(Link, { href: dataSyncingDocUrl, ...Utils.newTabLinkProps }, ['Read here for more details.'])
        ])
      })
      chooseMode(undefined)
    } else {
      await Ajax(signal).Runtimes.fileSyncing(googleProject, runtimeName).oldLocalize({
        [`~/${name}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
      })
      setLocalized(true)
    }
  })

  useOnMount(() => {
    localizeNotebook()
  })

  return h(Fragment, [
    h(PlaygroundHeader, [
      'Edits to this notebook are ',
      b(['NOT ']),
      'being saved to the workspace. To save your changes, download the notebook using the file menu.',
      h(Link, {
        style: { marginLeft: '0.5rem' },
        href: dataSyncingDocUrl,
        ...Utils.newTabLinkProps
      }, ['Read here for more details.'])
    ]),
    localized && cookieReady && h(Fragment, [
      iframe({
        src: `${proxyUrl}/notebooks/${name}/${notebookName}`,
        style: { border: 'none', flex: 1, ...styles },
        ref: frameRef
      }),
      h(JupyterFrameManager, {
        frameRef,
        onClose: () => Nav.goToPath(analysisTabName, { namespace, name }),
        details: { notebookName, name, namespace }
      })
    ]),
    busy && copyingAnalysisMessage
  ])
}

export const navPaths = [
  {
    name: analysisLauncherTabName,
    path: '/workspaces/:namespace/:name/analysis/launch/:analysisName',
    component: AnalysisLauncher,
    title: ({ name, analysisName }) => `${analysisName} - ${name}`
  }
]
