import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, iframe, p } from 'react-hyperscript-helpers'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common'
import { ComputeModal } from 'src/components/ComputeModal'
import Modal from 'src/components/Modal'
import { getDisplayName, notebookLockHash, ownerEmailHash, tools } from 'src/components/notebook-utils'
import { appLauncherTabName, RuntimeKicker, RuntimeStatusMonitor, StatusMessage } from 'src/components/runtime-common'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting, withErrorReportingInModal } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { forwardRefWithName, useCancellation, useOnMount, useStore } from 'src/libs/react-utils'
import { defaultLocation, getConvertedRuntimeStatus, getCurrentRuntime, usableStatuses } from 'src/libs/runtime-utils'
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
)(({ name: workspaceName, sparkInterface, refreshRuntimes, runtimes, persistentDisks, application, workspace, workspace: { workspace: { googleProject, bucketName } } }, ref) => {
  const cookieReady = useStore(cookieReadyStore)
  const signal = useCancellation()
  const { user: { email } } = useStore(authStore)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [location, setLocation] = useState(defaultLocation)
  const [outdated, setOutdated] = useState() // list of outdated files
  const [fileOutdatedOpen, setFileOutdatedOpen] = useState(false)

  // We've already init Welder if app is Jupyter.
  // TODO: We are stubbing this to never set up welder until we resolve some backend issues around file syncing
  // See following tickets for status (both parts needed):
  // PT1 - https://broadworkbench.atlassian.net/browse/IA-2991
  // PT2 - https://broadworkbench.atlassian.net/browse/IA-2990
  const [shouldSetupWelder, setShouldSetupWelder] = useState(application == tools.RStudio.label) // useState(application == tools.RStudio.label)

  const runtime = getCurrentRuntime(runtimes)
  const runtimeStatus = getConvertedRuntimeStatus(runtime) // preserve null vs undefined

  const FileOutdatedModal = ({ onDismiss,bucketName, userEmail }) => {
    const [outdatedAnalyses, setOutdatedAnalyses] = useState()

    useOnMount(() => {
      const findOutdatedAnalyses = withErrorReporting('Error loading outdated analyses', async () => {
        const hashedUser = await ownerEmailHash(userEmail)
        console.log("!!")
        const outdatedRAnalyses = checkForOutdatedAnalyses({ googleProject, bucketName })
        console.log(JSON.stringify(outdatedRAnalyses))
        //const outdatedRAnalyses = _.filter(({analysis}) => analysis.keys().contains(hashedUser) && analysis.get(hashedUser) == 'outdated', rAnalyses)
        setOutdatedAnalyses(outdatedRAnalyses)
      })
      findOutdatedAnalyses()
    })

    const handleChoice =  _.flow(
      Utils.withBusyState(setBusy),
      withErrorReportingInModal('Error setting up analysis file syncing')
    )(async shouldCopy => {
      await Promise.all(_.flatMap(async analysis => {
        const bucketObject = await Ajax(signal).Buckets.getObject(googleProject, bucketName, analysis)
        console.log("!!")
        console.log(JSON.stringify(bucketObject))
        // if (shouldCopy) {
        //
        // } else {
        //
        // }
      }))
    })

    return h(Modal, {
      width: 530,
      title: 'You have outdated markdown files',
      onDismiss,
      showButtons: false
    }, [
      p(outdatedAnalyses ?
        `There is a newer version of this file owned by.` :
        `There is a newer version of this markdown file.`),
      p('You can make a copy of your version, or choose to keep your version and have it not be synced to the workspace bucket.'),
      div({ style: { marginTop: '2rem' } }, [
        h(ButtonSecondary, {
          style: { padding: '0 1rem' },
          onClick: () => handleChoice(true)
        }, ['Make a copy']),
        h(ButtonPrimary, {
          onClick: () => handleChoice(false)
        }, ['Keep outdated version'])
      ])
    ])
  }

  const checkForOutdatedAnalyses = async ({ googleProject, bucketName}) => {
    const analyses = await Ajax(signal).Buckets.listAnalyses(googleProject, bucketName)// workspace.workspace.bucketName
    return _.filter(({ name }) => name.endsWith(`.${tools.RStudio.ext}`), analyses)
  }

  useEffect(() => {
    const runtime = getCurrentRuntime(runtimes)
    const runtimeStatus = getConvertedRuntimeStatus(runtime)

    const setupWelder = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Error setting up analysis file syncing')
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
      withErrorReporting('Error loading bucket location')
    )(async () => {
      const { location } = await Ajax()
        .Workspaces
        .workspace(workspace.namespace, workspace.name)
        .checkBucketLocation(googleProject, bucketName)
      setLocation(location)
    })

    loadBucketLocation()

    if (shouldSetupWelder && runtimeStatus === 'Running') {
      setupWelder()
      setShouldSetupWelder(true)
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
    h(RuntimeKicker, {
      runtime, refreshRuntimes,
      onNullRuntime: () => setShowCreate(true)
    }),
    fileOutdatedOpen && h(FileOutdatedModal, {onDismiss: () => setFileOutdatedOpen(false), bucketName, email}),
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
