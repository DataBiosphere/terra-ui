import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, iframe, p, strong } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common'
import { ComputeModal } from 'src/components/ComputeModal'
import Modal from 'src/components/Modal'
import { notebookLockHash, stripExtension, tools } from 'src/components/notebook-utils'
import { appLauncherTabName, RuntimeKicker, RuntimeStatusMonitor, StatusMessage } from 'src/components/runtime-common'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting, withErrorReportingInModal } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { defaultLocation, getAnalysesDisplayList, getConvertedRuntimeStatus, getCurrentRuntime, usableStatuses } from 'src/libs/runtime-utils'
import { authStore, cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const getSparkInterfaceSource = (proxyUrl, sparkInterface) => {
  console.assert(_.endsWith('/jupyter', proxyUrl), 'Unexpected ending for proxy URL')
  const proxyUrlWithlastSegmentDropped = _.flow(_.split('/'), _.dropRight(1), _.join('/'))(proxyUrl)
  return `${proxyUrlWithlastSegmentDropped}/${sparkInterface}`
}

const getApplicationIFrameSource = (proxyUrl, application, sparkInterface) => {
  return Utils.switchCase(application,
    [tools.jupyterTerminal.label, () => `${proxyUrl}/terminals/1`],
    [tools.spark.label, () => getSparkInterfaceSource(proxyUrl, sparkInterface)],
    [tools.RStudio.label, () => proxyUrl],
    [Utils.DEFAULT, () => console.error(`Expected ${application} to be one of terminal, spark or ${tools.RStudio.label}.`)]
  )
}

const ApplicationLauncher = _.flow(
  forwardRefWithName('ApplicationLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('application'),
    activeTab: appLauncherTabName
  }) // TODO: Check if name: workspaceName could be moved into the other workspace deconstruction
)(({
  name: workspaceName, sparkInterface, analysesData: { runtimes, refreshRuntimes, persistentDisks },
  application, workspace, workspace: { workspace: { googleProject, bucketName } }
}, _ref) => {
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [location, setLocation] = useState(defaultLocation)
  const [outdatedAnalyses, setOutdatedAnalyses] = useState()
  const [fileOutdatedOpen, setFileOutdatedOpen] = useState(false)
  const [hashedOwnerEmail, setHashedOwnerEmail] = useState()

  const cookieReady = useStore(cookieReadyStore)
  const signal = useCancellation()
  const interval = useRef()
  const { user: { email } } = useStore(authStore)

  // We've already init Welder if app is Jupyter
  // This sets up welder for .rmd files, which is slightly different from Jupyter
  // Jupyter is always launched with a specific file, which is localized
  // RStudio is launched in a general sense, and all files are localized.
  // This line ensures storageLinks are setup whenever RSTudio is launched
  const [shouldSetupWelder, setShouldSetupWelder] = useState(application === tools.RStudio.label)

  const runtime = getCurrentRuntime(runtimes)
  const runtimeStatus = getConvertedRuntimeStatus(runtime) // preserve null vs undefined

  const FileOutdatedModal = ({ onDismiss, bucketName }) => {
    const handleChoice = _.flow(
      withErrorReportingInModal('Error setting up analysis file syncing (test 4)')(onDismiss),
      Utils.withBusyState(setBusy)
    )(async shouldCopy => {
      // this modal only opens when the state variable outdatedAnalyses is non empty (keeps track of a user's outdated RStudio files). it gives users two options when their files are in use by another user
      // 1) make copies of those files and continue working on the copies or 2) do nothing.
      // in either case, their original version of the analysis is outdated and we will no longer sync that file to the workspace bucket for the current user
      await Promise.all(_.flatMap(async ({ name, metadata: currentMetadata }) => {
        const file = getFileName(name)
        const newMetadata = currentMetadata
        if (shouldCopy) {
          // clear 'outdated' metadata (which gets populated by welder) so that new copy file does not get marked as outdated
          newMetadata[hashedOwnerEmail] = ''
          await Ajax().Buckets.analysis(googleProject, bucketName, stripExtension(file), tools.RStudio.label).copyWithMetadata(getCopyName(file), bucketName, newMetadata)
        }
        // update bucket metadata for the outdated file to be marked as doNotSync so that welder ignores the outdated file for the current user
        newMetadata[hashedOwnerEmail] = 'doNotSync'
        await Ajax().Buckets.analysis(googleProject, bucketName, stripExtension(file), tools.RStudio.label).updateMetadata(file, newMetadata)
      }, outdatedAnalyses))
      onDismiss()
    })

    const getCopyName = file => `${stripExtension(file)}_copy${Date.now()}.${tools.RStudio.ext}`

    const getFileName = _.flow(
      _.split('/'),
      _.nth(1)
    )

    const getAnalysisNameFromList = _.flow(
      _.head,
      _.get('name'),
      getFileName
    )

    return h(Modal, {
      onDismiss,
      width: 530,
      title: _.size(outdatedAnalyses) > 1 ? 'R Markdown Files In Use' : `R Markdown File Is In Use`,
      showButtons: false
    }, [
      Utils.cond(
        // if user has more than one outdated rstudio analysis, display plural phrasing
        [_.size(outdatedAnalyses) > 1, () => [p([`These R markdown files are being edited by another user and your versions are now outdated. Your files will no longer sync with the workspace bucket.`]),
          p([getAnalysesDisplayList(outdatedAnalyses)]),
          p(['You can']),
          p(['1) ', strong(['save your changes as new copies']), ' of your files which will enable file syncing on the copies']),
          p([strong(['or'])]),
          p(['2) ', strong(['continue working on your versions']), ` of ${getAnalysesDisplayList(outdatedAnalyses)} with file syncing disabled.`])]],
        // if user has one outdated rstudio analysis, display singular phrasing
        [_.size(outdatedAnalyses) === 1, () => [p([`${getAnalysisNameFromList(outdatedAnalyses)} is being edited by another user and your version is now outdated. Your file will no longer sync with the workspace bucket.`]),
          p(['You can']),
          p(['1) ', strong(['save your changes as a new copy']), ` of ${getAnalysisNameFromList(outdatedAnalyses)} which will enable file syncing on the copy`]),
          p([strong(['or'])]),
          p(['2) ', strong(['continue working on your outdated version']), ` of ${getAnalysisNameFromList(outdatedAnalyses)} with file syncing disabled.`])]]),
      div({ style: { marginTop: '2rem' } }, [
        h(ButtonSecondary, {
          style: { padding: '0 1rem' },
          onClick: () => handleChoice(false)
        }, ['Keep outdated version']),
        h(ButtonPrimary, {
          style: { padding: '0 1rem' },
          onClick: () => handleChoice(true)
        }, ['Make a copy'])
      ])
    ])
  }

  const checkForOutdatedAnalyses = async ({ googleProject, bucketName }) => {
    const analyses = await Ajax(signal).Buckets.listAnalyses(googleProject, bucketName)
    return _.filter(analysis => _.endsWith(`.${tools.RStudio.ext}`, analysis?.name) && analysis?.metadata &&
      analysis?.metadata[hashedOwnerEmail] === 'outdated', analyses)
  }

  useOnMount(() => {
    const findHashedEmail = withErrorReporting('Error loading user email information', async () => {
      const hashedEmail = await notebookLockHash(bucketName, email)
      setHashedOwnerEmail(hashedEmail)
    })

    refreshRuntimes()
    findHashedEmail()
  })

  useEffect(() => {
    const runtime = getCurrentRuntime(runtimes)
    const runtimeStatus = getConvertedRuntimeStatus(runtime)

    const setupWelder = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error setting up analysis file syncing (test 1)')
    )(async () => {
      const localBaseDirectory = ``
      const localSafeModeBaseDirectory = ``
      const cloudStorageDirectory = `gs://${bucketName}/notebooks`

      await Ajax()
        .Runtimes
        .fileSyncing(googleProject, runtime.runtimeName)
        .setStorageLinks(localBaseDirectory, localSafeModeBaseDirectory, cloudStorageDirectory, `.*\\.Rmd`)
    })

    const loadBucketLocation = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error loading bucket location (test 2')
    )(async () => {
      const { location } = await Ajax()
        .Workspaces
        .workspace(workspace.namespace, workspace.name)
        .checkBucketLocation(googleProject, bucketName)
      setLocation(location)
    })

    !!googleProject && loadBucketLocation()

    if (shouldSetupWelder && runtimeStatus === 'Running') {
      setupWelder()
      setShouldSetupWelder(true)
    }

    const findOutdatedAnalyses = withErrorReporting('Error loading outdated analyses', async () => {
      const outdatedRAnalyses = await checkForOutdatedAnalyses({ googleProject, bucketName })
      setOutdatedAnalyses(outdatedRAnalyses)
      !_.isEmpty(outdatedRAnalyses) && setFileOutdatedOpen(true)
    })

    !!googleProject && findOutdatedAnalyses()

    // periodically check for outdated R analyses
    interval.current = !!googleProject && setInterval(findOutdatedAnalyses, 10000)

    return () => {
      clearInterval(interval.current)
      interval.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleProject, workspaceName, runtimes, bucketName])

  return h(Fragment, [
    h(RuntimeStatusMonitor, {
      runtime,
      onRuntimeStartedRunning: () => {
        Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: application })
      }
    }),
    h(RuntimeKicker, { runtime, refreshRuntimes }),
    fileOutdatedOpen && h(FileOutdatedModal, { onDismiss: () => setFileOutdatedOpen(false), bucketName }),
    _.includes(runtimeStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        iframe({
          src: getApplicationIFrameSource(runtime.proxyUrl, application, sparkInterface),
          style: {
            border: 'none', flex: 1,
            ...(application === tools.jupyterTerminal.label ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
          },
          title: `Interactive ${application} iframe`
        })
      ]) :
      div({ style: { padding: '2rem' } }, [
        !busy && h(StatusMessage, { hideSpinner: ['Error', 'Stopped', null].includes(runtimeStatus) }, [
          Utils.cond(
            [runtimeStatus === 'Creating', () => 'Creating cloud environment. You can navigate away and return in 3-5 minutes.'],
            [runtimeStatus === 'Starting', () => 'Starting cloud environment, this may take up to 2 minutes.'],
            [_.includes(runtimeStatus, usableStatuses), () => 'Almost ready...'],
            [runtimeStatus === 'Stopping', () => 'Cloud environment is stopping, which takes ~4 minutes. You can restart it after it finishes.'],
            [runtimeStatus === 'Stopped', () => 'Cloud environment is stopped. Start it to edit your notebook or use the terminal.'],
            [runtimeStatus === 'LeoReconfiguring', () => 'Cloud environment is updating, please wait.'],
            [runtimeStatus === 'Error', () => 'Error with the cloud environment, please try again.'],
            [runtimeStatus === null, () => 'Create a cloud environment to continue.'],
            [runtimeStatus === undefined, () => 'Loading...'],
            () => 'Unknown cloud environment status. Please create a new cloud environment or contact support.'
          )
        ]),
        h(ComputeModal, {
          isOpen: showCreate,
          workspace,
          runtimes,
          persistentDisks,
          location,
          onDismiss: () => setShowCreate(false),
          onSuccess: _.flow(
            withErrorReporting('Error loading cloud environment'),
            Utils.withBusyState(setBusy)
          )(async () => {
            setShowCreate(false)
            await refreshRuntimes(true)
          })
        }),
        busy && spinnerOverlay
      ])
  ])
})


export const navPaths = [
  {
    name: 'workspace-terminal', // legacy
    path: '/workspaces/:namespace/:name/notebooks/terminal',
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('workspace-application-launch', { ...props, application: 'terminal' }) })
  },
  {
    name: appLauncherTabName,
    path: '/workspaces/:namespace/:name/applications/:application',
    component: ApplicationLauncher,
    title: ({ name, application }) => `${name} - ${application}`
  },
  {
    name: 'workspace-spark-interface-launch',
    path: '/workspaces/:namespace/:name/applications/:application/:sparkInterface',
    component: ApplicationLauncher,
    title: ({ name, application, sparkInterface }) => `${name} - ${application} - ${sparkInterface}`
  }
]
