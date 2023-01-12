import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, iframe, p, strong } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting, withErrorReportingInModal } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { authStore, azureCookieReadyStore, cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { getExtension, notebookLockHash, stripExtension } from 'src/pages/workspaces/workspace/analysis/file-utils'
import { appLauncherTabName, PeriodicAzureCookieSetter, RuntimeKicker, RuntimeStatusMonitor, StatusMessage } from 'src/pages/workspaces/workspace/analysis/runtime-common'
import { getAnalysesDisplayList, getConvertedRuntimeStatus, getCurrentRuntime, usableStatuses } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { getPatternFromRuntimeTool, getToolLabelFromRuntime, runtimeTools, toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const ApplicationLauncher = _.flow(
  forwardRefWithName('ApplicationLauncher'),
  wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: _.get('application'),
    activeTab: appLauncherTabName
  })
)(({
  name: workspaceName, sparkInterface, analysesData: { runtimes, refreshRuntimes },
  application, workspace: { azureContext, workspace: { workspaceId, googleProject, bucketName } }
}, _ref) => {
  const [busy, setBusy] = useState(false)
  const [outdatedAnalyses, setOutdatedAnalyses] = useState()
  const [fileOutdatedOpen, setFileOutdatedOpen] = useState(false)
  const [hashedOwnerEmail, setHashedOwnerEmail] = useState()
  const [iframeSrc, setIframeSrc] = useState()

  const leoCookieReady = useStore(cookieReadyStore)
  const azureCookieReady = useStore(azureCookieReadyStore)
  const cookieReady = !!googleProject ? leoCookieReady : azureCookieReady.readyForRuntime
  const signal = useCancellation()
  const interval = useRef()
  const { user: { email } } = useStore(authStore)

  // We've already init Welder if app is Jupyter in google
  // This sets up welder for RStudio and Jupyter Lab Apps
  // Jupyter is always launched with a specific file, which is localized
  // RStudio/Jupyter Lab in Azure are launched in a general sense, and all files are localized.
  const [shouldSetupWelder, setShouldSetupWelder] = useState(application === toolLabels.RStudio || application === toolLabels.JupyterLab)

  const runtime = getCurrentRuntime(runtimes)
  const runtimeStatus = getConvertedRuntimeStatus(runtime) // preserve null vs undefined

  const FileOutdatedModal = ({ onDismiss, bucketName }) => {
    const handleChoice = _.flow(
      withErrorReportingInModal('Error setting up analysis file syncing')(onDismiss),
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
          await Ajax().Buckets.analysis(googleProject, bucketName, file, toolLabels.RStudio).copyWithMetadata(getCopyName(file), bucketName, newMetadata)
        }
        // update bucket metadata for the outdated file to be marked as doNotSync so that welder ignores the outdated file for the current user
        newMetadata[hashedOwnerEmail] = 'doNotSync'
        await Ajax().Buckets.analysis(googleProject, bucketName, file, toolLabels.RStudio).updateMetadata(file, newMetadata)
      }, outdatedAnalyses))
      onDismiss()
    })

    const getCopyName = file => {
      const ext = getExtension(file)
      return `${stripExtension(file)}_copy${Date.now()}.${ext}`
    }

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
      title: _.size(outdatedAnalyses) > 1 ? 'R files in use' : 'R file is in use',
      showButtons: false
    }, [
      Utils.cond(
        // if user has more than one outdated rstudio analysis, display plural phrasing
        [_.size(outdatedAnalyses) > 1, () => [p(['These R files are being edited by another user and your versions are now outdated. Your files will no longer sync with the workspace bucket.']),
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
    return _.filter(analysis => _.includes(getExtension(analysis?.name), runtimeTools.RStudio.ext) && analysis?.metadata &&
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

    const computeIframeSrc = withErrorReporting('Error loading application iframe', async () => {
      const getSparkInterfaceSource = proxyUrl => {
        console.assert(_.endsWith('/jupyter', proxyUrl), 'Unexpected ending for proxy URL')
        const proxyUrlWithlastSegmentDropped = _.flow(_.split('/'), _.dropRight(1), _.join('/'))(proxyUrl)
        return `${proxyUrlWithlastSegmentDropped}/${sparkInterface}`
      }

      const proxyUrl = runtime?.proxyUrl
      const url = await Utils.switchCase(application,
        [toolLabels.terminal, () => `${proxyUrl}/terminals/1`],
        [toolLabels.spark, () => getSparkInterfaceSource(proxyUrl)],
        [toolLabels.RStudio, () => proxyUrl],
        [toolLabels.JupyterLab, () => `${proxyUrl}/lab`],
        [Utils.DEFAULT, () => console.error(`Expected ${application} to be one of terminal, spark, ${toolLabels.RStudio}, or ${toolLabels.JupyterLab}.`)]
      )

      setIframeSrc(url)
    })

    const setupWelder = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error setting up analysis file syncing')
    )(async () => {
      //The special case here is because for GCP, Jupyter and JupyterLab can both be run on the same runtime and a
      //user may toggle back and forth between them. In order to keep notebooks tidy and in a predictable location on
      //disk, we mirror the localBaseDirectory used by edit mode for Jupyter.
      //Once Jupyter is phased out in favor of JupyterLab for GCP, the localBaseDirectory can be '' for all cases
      const localBaseDirectory = !!googleProject && application === toolLabels.JupyterLab ? `${workspaceName}/edit` : ''

      const { storageContainerName: azureStorageContainer } = !!azureContext ? await Ajax(signal).AzureStorage.details(workspaceId) : {}
      const cloudStorageDirectory = !!azureContext ? `${azureStorageContainer}/analyses` : `gs://${bucketName}/notebooks`

      //TODO: fix this when relay is working https://broadworkbench.atlassian.net/browse/IA-3700
      !!googleProject ?
        await Ajax()
          .Runtimes
          .fileSyncing(googleProject, runtime.runtimeName)
          .setStorageLinks(localBaseDirectory, '', cloudStorageDirectory, getPatternFromRuntimeTool(getToolLabelFromRuntime(runtime))) :
        await Ajax()
          .Runtimes
          .azureProxy(runtime.proxyUrl)
          .setStorageLinks(localBaseDirectory, cloudStorageDirectory, getPatternFromRuntimeTool(getToolLabelFromRuntime(runtime)))
    })


    if (shouldSetupWelder && runtimeStatus === 'Running') {
      setupWelder()
      setShouldSetupWelder(false)
    }

    const findOutdatedAnalyses = async () => {
      try {
        const outdatedRAnalyses = await checkForOutdatedAnalyses({ googleProject, bucketName })
        setOutdatedAnalyses(outdatedRAnalyses)
        !_.isEmpty(outdatedRAnalyses) && setFileOutdatedOpen(true)
      } catch (error) {
        notify('error', 'Error loading outdated analyses', {
          id: 'error-loading-outdated-analyses',
          detail: error instanceof Response ? await error.text() : error
        })
      }
    }

    computeIframeSrc()
    if (runtimeStatus === 'Running') {
      !!googleProject && findOutdatedAnalyses()

      // periodically check for outdated R analyses
      interval.current = !!googleProject && setInterval(findOutdatedAnalyses, 10000)
    }

    return () => {
      clearInterval(interval.current)
      interval.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleProject, workspaceName, runtimes, bucketName])

  return h(Fragment, [
    h(RuntimeStatusMonitor, {
      runtime
    }),
    h(RuntimeKicker, { runtime, refreshRuntimes }),
    // We cannot attach the periodic cookie setter until we have a running runtime for azure, because the relay is not guaranteed to be ready until then
    !!azureContext && getConvertedRuntimeStatus(runtime) === 'Running' ? h(PeriodicAzureCookieSetter, { proxyUrl: runtime.proxyUrl }) : null,
    fileOutdatedOpen && h(FileOutdatedModal, { onDismiss: () => setFileOutdatedOpen(false), bucketName }),
    _.includes(runtimeStatus, usableStatuses) && cookieReady ?
      h(Fragment, [
        application === toolLabels.JupyterLab && div({ style: { padding: '2rem', position: 'absolute', top: 0, left: 0, zIndex: 1 } }, [
          h(StatusMessage, {}, ['Your Virtual Machine (VM) is ready. JupyterLab will launch momentarily...'])
        ]),
        iframe({
          src: iframeSrc,
          style: {
            border: 'none', flex: 1, zIndex: 2,
            ...(application === toolLabels.terminal ? { marginTop: -45, clipPath: 'inset(45px 0 0)' } : {}) // cuts off the useless Jupyter top bar
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
