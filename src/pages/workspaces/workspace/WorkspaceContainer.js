import { differenceInSeconds, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { br, div, h, h2, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { ContextBar } from 'src/components/ContextBar'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { tools } from 'src/components/notebook-utils'
import { locationTypes } from 'src/components/region-common'
import { analysisTabName } from 'src/components/runtime-common'
import RuntimeManager from 'src/components/RuntimeManager'
import { TabBar } from 'src/components/tabBars'
import TopBar from 'src/components/TopBar'
import { Ajax, saToken } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { isAnalysisTabVisible, isTerra } from 'src/libs/config'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { clearNotification, notify } from 'src/libs/notifications'
import { useCancellation, useOnMount, usePrevious, useStore, withDisplayName } from 'src/libs/react-utils'
import { defaultLocation, getConvertedRuntimeStatus, getCurrentApp, getCurrentRuntime, getDiskAppType, mapToPdTypes } from 'src/libs/runtime-utils'
import { workspaceStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'
import WorkspaceMenu from 'src/pages/workspaces/workspace/WorkspaceMenu'


const WorkspacePermissionNotice = ({ workspace }) => {
  const isReadOnly = !Utils.canWrite(workspace.accessLevel)
  const isLocked = workspace.workspace.isLocked

  return (isReadOnly || isLocked) && span({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: '2rem',
      padding: '0 1rem',
      borderRadius: '1rem',
      marginRight: '2rem',
      backgroundColor: colors.dark(0.15),
      textTransform: 'none'
    }
  }, [
    isLocked ? icon('lock', { size: 16 }) : icon('eye', { size: 20 }),
    span({ style: { marginLeft: '1ch' } }, [
      Utils.cond(
        [isLocked && isReadOnly, () => 'Workspace is locked and read only'],
        [isLocked, () => 'Workspace is locked'],
        [isReadOnly, () => 'Workspace is read only']
      )
    ])
  ])
}

const WorkspaceTabs = ({
  namespace, name, workspace, isGoogleWorkspace, activeTab, refresh,
  setDeletingWorkspace, setCloningWorkspace, setSharingWorkspace, setShowLockWorkspaceModal
}) => {
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  const canShare = workspace?.canShare
  const isLocked = workspace?.workspace.isLocked
  const isAzureWorkspace = !isGoogleWorkspace

  const onClone = () => setCloningWorkspace(true)
  const onDelete = () => setDeletingWorkspace(true)
  const onLock = () => setShowLockWorkspaceModal(true)
  const onShare = () => setSharingWorkspace(true)

  const tabs = [
    { name: 'dashboard', link: 'workspace-dashboard' },
    ...(isGoogleWorkspace ? [{ name: 'data', link: 'workspace-data' }] : []),
    ...(isGoogleWorkspace && !isAnalysisTabVisible() ? [{ name: 'notebooks', link: 'workspace-notebooks' }] : []),
    // the spread operator results in no array entry if the config value is false
    // we want this feature gated until it is ready for release
    ...(isAnalysisTabVisible() ? [{ name: 'analyses', link: analysisTabName }] : []),
    ...(isGoogleWorkspace ? [{ name: 'workflows', link: 'workspace-workflows' }] : []),
    ...(isGoogleWorkspace ? [{ name: 'job history', link: 'workspace-job-history' }] : [])
  ]
  return h(Fragment, [
    h(TabBar, {
      'aria-label': 'Workspace Navigation Tabs',
      activeTab, refresh,
      tabNames: _.map('name', tabs),
      getHref: currentTab => Nav.getLink(_.find({ name: currentTab }, tabs).link, { namespace, name })
    }, [
      workspace && h(WorkspacePermissionNotice, { workspace }),
      h(WorkspaceMenu, {
        iconSize: 27, popupLocation: 'bottom',
        callbacks: { onClone, onShare, onLock, onDelete },
        workspaceInfo: { canShare, isAzureWorkspace, isLocked, isOwner }
      })
    ])
  ])
}

const WorkspaceContainer = ({
  namespace, name, breadcrumbs, topBarContent, title, activeTab, showTabBar = true,
  analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks, location, locationType },
  refresh, workspace, refreshWorkspace, children
}) => {
  const [deletingWorkspace, setDeletingWorkspace] = useState(false)
  const [cloningWorkspace, setCloningWorkspace] = useState(false)
  const [sharingWorkspace, setSharingWorkspace] = useState(false)
  const [showLockWorkspaceModal, setShowLockWorkspaceModal] = useState(false)

  // If googleProject is not undefined (server info not yet loaded)
  // and not the empty string, we know that we have a Google workspace.
  const isGoogleWorkspace = !!workspace?.workspace.googleProject

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({ style: Style.noWrapEllipsis }, breadcrumbs),
        h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [title || `${namespace}/${name}`])
      ]),
      topBarContent,
      div({ style: { flexGrow: 1 } }),
      isTerra() && h(Link, {
        href: 'https://support.terra.bio/hc/en-us/articles/360041068771--COVID-19-workspaces-data-and-tools-in-Terra',
        style: {
          backgroundColor: colors.light(), borderRadius: 4,
          marginRight: '1.5rem', marginLeft: '0.5rem', padding: '0.4rem 0.8rem',
          display: 'flex', alignItems: 'center', flexShrink: 0
        },
        ...Utils.newTabLinkProps
      }, [
        icon('virus', { size: 24, style: { marginRight: '0.5rem' } }),
        div({ style: { fontSize: 12, color: colors.dark() } }, ['COVID-19', br(), 'Data & Tools'])
      ]),
      h(RuntimeManager, {
        namespace, name, runtimes, persistentDisks, refreshRuntimes,
        canCompute: !!(workspace?.canCompute || runtimes?.length),
        apps, appDataDisks, workspace, refreshApps, location, locationType
      })
    ]),
    showTabBar && h(WorkspaceTabs, {
      namespace, name, activeTab, refresh, workspace, setDeletingWorkspace, setCloningWorkspace,
      setSharingWorkspace, setShowLockWorkspaceModal, isGoogleWorkspace
    }),
    div({ role: 'main', style: Style.elements.pageContentContainer },
      (isAnalysisTabVisible() ?
        [div({ style: { flex: 1, display: 'flex' } }, [
          div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [
            children
          ]),
          workspace && h(ContextBar, {
            workspace, apps, appDataDisks, refreshApps, runtimes, persistentDisks, refreshRuntimes, location, locationType
          })
        ])] : [children])),
    deletingWorkspace && h(DeleteWorkspaceModal, {
      workspace,
      onDismiss: () => setDeletingWorkspace(false),
      onSuccess: () => Nav.goToPath('workspaces')
    }),
    cloningWorkspace && h(NewWorkspaceModal, {
      cloneWorkspace: workspace,
      onDismiss: () => setCloningWorkspace(false),
      onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
    }),
    showLockWorkspaceModal && h(LockWorkspaceModal, {
      workspace,
      onDismiss: () => setShowLockWorkspaceModal(false),
      onSuccess: () => refreshWorkspace()
    }),
    sharingWorkspace && h(ShareWorkspaceModal, {
      workspace,
      onDismiss: () => setSharingWorkspace(false)
    })
  ])
}


const WorkspaceAccessError = () => {
  const groupURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9553'
  const authorizationURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'
  return div({ style: { padding: '2rem', flexGrow: 1 } }, [
    h2(['Could not display workspace']),
    p(['You are trying to access a workspace that either does not exist, or you do not have access to it.']),
    p([
      'You are currently logged in as ',
      span({ style: { fontWeight: 600 } }, [getUser().email]),
      '. You may have access with a different account.'
    ]),
    p([
      'To view an existing workspace, the owner of the workspace must share it with you or with a ',
      h(Link, { ...Utils.newTabLinkProps, href: groupURL }, 'Group'), ' of which you are a member. ',
      'If the workspace is protected under an ', h(Link, { ...Utils.newTabLinkProps, href: authorizationURL }, 'Authorization Domain'),
      ', you must be a member of every group within the Authorization Domain.'
    ]),
    p(['If you think the workspace exists but you do not have access, please contact the workspace owner.']),
    h(ButtonPrimary, {
      href: Nav.getLink('workspaces')
    }, ['Return to Workspace List'])
  ])
}

const useCloudEnvironmentPolling = (googleProject, workspaceNamespace) => {
  const signal = useCancellation()
  const timeout = useRef()
  const [runtimes, setRuntimes] = useState()
  const [persistentDisks, setPersistentDisks] = useState()
  const [appDataDisks, setAppDataDisks] = useState()

  const reschedule = ms => {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(refreshRuntimesSilently, ms)
  }
  const load = async maybeStale => {
    try {
      const [newDisks, newRuntimes] = await Promise.all([
        Ajax(signal).Disks.list({ googleProject, creator: getUser().email, includeLabels: 'saturnApplication,saturnWorkspaceName' }),
        !!workspaceNamespace ? Ajax(signal).Runtimes.listV2({ creator: getUser().email, saturnWorkspaceNamespace: workspaceNamespace }) : []
      ])

      setRuntimes(newRuntimes)
      setAppDataDisks(_.remove(disk => _.isUndefined(getDiskAppType(disk)), newDisks))
      setPersistentDisks(mapToPdTypes(_.filter(disk => _.isUndefined(getDiskAppType(disk)), newDisks)))

      const runtime = getCurrentRuntime(newRuntimes)
      reschedule(maybeStale || _.includes(getConvertedRuntimeStatus(runtime), ['Creating', 'Starting', 'Stopping', 'Updating', 'LeoReconfiguring']) ?
        10000 :
        120000)
    } catch (error) {
      reschedule(30000)
      throw error
    }
  }
  const refreshRuntimes = withErrorReporting('Error loading cloud environments', load)
  const refreshRuntimesSilently = withErrorIgnoring(load)
  useOnMount(() => {
    refreshRuntimes()
    return () => clearTimeout(timeout.current)
  })
  return { runtimes, refreshRuntimes, persistentDisks, appDataDisks }
}

const useAppPolling = (googleProject, workspaceName) => {
  const signal = useCancellation()
  const timeout = useRef()
  const [apps, setApps] = useState()
  const reschedule = ms => {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(refreshAppsSilently, ms)
  }
  const loadApps = async () => {
    try {
      const newApps = !!googleProject ?
        await Ajax(signal).Apps.list(googleProject, { creator: getUser().email, saturnWorkspaceName: workspaceName }) :
        []
      setApps(newApps)
      _.forOwn(tool => {
        if (tool.appType) {
          const app = getCurrentApp(tool.appType)(newApps)
          reschedule((app && _.includes(app.status, ['PROVISIONING', 'PREDELETING'])) ? 10000 : 120000)
        }
      })(tools)
    } catch (error) {
      reschedule(30000)
      throw error
    }
  }
  const refreshApps = withErrorReporting('Error loading apps', loadApps)
  const refreshAppsSilently = withErrorIgnoring(loadApps)
  useOnMount(() => {
    refreshApps()
    return () => clearTimeout(timeout.current)
  })
  return { apps, refreshApps }
}

export const wrapWorkspace = ({ breadcrumbs, activeTab, title, topBarContent, showTabBar = true }) => WrappedComponent => {
  const Wrapper = props => {
    const { namespace, name } = props
    const child = useRef()
    const signal = useCancellation()
    const [accessError, setAccessError] = useState(false)
    const accessNotificationId = useRef()
    const cachedWorkspace = useStore(workspaceStore)
    const [loadingWorkspace, setLoadingWorkspace] = useState(false)
    const workspace = cachedWorkspace && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedWorkspace.workspace)) ?
      cachedWorkspace :
      undefined
    const [googleProject, setGoogleProject] = useState(workspace?.workspace.googleProject)
    const [azureContext, setAzureContext] = useState(workspace?.azureContext)
    const [{ location, locationType }, setBucketLocation] = useState({ location: defaultLocation, locationType: locationTypes.default })

    const prevGoogleProject = usePrevious(googleProject)
    const prevAzureContext = usePrevious(azureContext)

    const { runtimes, refreshRuntimes, persistentDisks, appDataDisks } = useCloudEnvironmentPolling(googleProject, workspace?.workspace.namespace)
    const { apps, refreshApps } = useAppPolling(googleProject, name)
    const isGoogleWorkspace = !!googleProject
    const isAzureWorkspace = !!azureContext
    // The following if statements are necessary to support the context bar properly loading runtimes for google/azure
    // Note that the refreshApps function currently is not supported for azure
    if (googleProject !== prevGoogleProject && isGoogleWorkspace) {
      refreshRuntimes()
      refreshApps()
    }
    if (azureContext !== prevAzureContext && isAzureWorkspace) {
      refreshRuntimes(true)
    }

    const loadBucketLocation = async (googleProject, bucketName) => {
      if (!!googleProject) {
        const bucketLocation = await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketLocation(googleProject, bucketName)
        setBucketLocation(bucketLocation)
      }
    }

    const refreshWorkspace = _.flow(
      withErrorReporting('Error loading workspace'),
      Utils.withBusyState(setLoadingWorkspace)
    )(async () => {
      try {
        const workspace = await Ajax(signal).Workspaces.workspace(namespace, name).details([
          'accessLevel', 'azureContext', 'canCompute', 'canShare', 'owners',
          'workspace', 'workspace.attributes', 'workspace.authorizationDomain',
          'workspace.isLocked', 'workspaceSubmissionStats'
        ])
        workspaceStore.set(workspace)
        setGoogleProject(workspace.workspace.googleProject)
        setAzureContext(workspace.azureContext)

        const { accessLevel, workspace: { bucketName, createdBy, createdDate, googleProject } } = workspace
        const isGoogleWorkspace = !!googleProject

        loadBucketLocation(googleProject, bucketName)
        // Request a service account token. If this is the first time, it could take some time before everything is in sync.
        // Doing this now, even though we don't explicitly need it now, increases the likelihood that it will be ready when it is needed.
        if (Utils.canWrite(accessLevel) && isGoogleWorkspace) {
          saToken(googleProject)
        }

        if (!Utils.isOwner(accessLevel) && (createdBy === getUser().email) && (differenceInSeconds(Date.now(), parseJSON(createdDate)) < 60)) {
          accessNotificationId.current = notify('info', 'Workspace access synchronizing', {
            message: h(Fragment, [
              'It looks like you just created this workspace. It may take up to a minute before you have access to modify it. Refresh at any time to re-check.',
              div({ style: { marginTop: '1rem' } }, [h(Link, {
                onClick: () => {
                  refreshWorkspace()
                  clearNotification(accessNotificationId.current)
                }
              }, 'Click to refresh now')])
            ])
          })
        }
      } catch (error) {
        if (error.status === 404) {
          setAccessError(true)
        } else {
          throw error
        }
      }
    })

    useOnMount(() => {
      if (!workspace) {
        refreshWorkspace()
      }
    })

    if (accessError) {
      return h(FooterWrapper, [h(TopBar), h(WorkspaceAccessError)])
    } else {
      return h(WorkspaceContainer, {
        namespace, name, activeTab, showTabBar, workspace, refreshWorkspace,
        title: _.isFunction(title) ? title(props) : title,
        breadcrumbs: breadcrumbs(props),
        topBarContent: topBarContent && topBarContent({ workspace, ...props }),
        analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, persistentDisks, location, locationType },
        refresh: async () => {
          await refreshWorkspace()
          if (child.current?.refresh) {
            child.current.refresh()
          }
        }
      }, [
        workspace && h(WrappedComponent, {
          ref: child,
          workspace, refreshWorkspace, analysesData: { apps, refreshApps, runtimes, refreshRuntimes, appDataDisks, location, persistentDisks },
          ...props
        }),
        loadingWorkspace && spinnerOverlay
      ])
    }
  }
  return withDisplayName('wrapWorkspace', Wrapper)
}
