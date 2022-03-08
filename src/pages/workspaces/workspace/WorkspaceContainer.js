import { differenceInSeconds, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { br, div, h, h2, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, Clickable, Link, spinnerOverlay } from 'src/components/common'
import { ContextBar } from 'src/components/ContextBar'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { tools } from 'src/components/notebook-utils'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { locationTypes } from 'src/components/region-common'
import { analysisTabName, contextBarTabs } from 'src/components/runtime-common'
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
import { defaultLocation, getConvertedRuntimeStatus, getCurrentApp, getCurrentRuntime, getDiskAppType } from 'src/libs/runtime-utils'
import { workspaceStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const navIconProps = {
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}

const WorkspaceTabs = ({
  namespace, name, workspace, activeTab, refresh,
  deletingWorkspace, setDeletingWorkspace, cloningWorkspace, setCloningWorkspace,
  sharingWorkspace, setSharingWorkspace, togglingWorkspaceLock, setTogglingWorkspaceLock
}) => {
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  const canShare = workspace?.canShare
  const isLocked = workspace?.workspace.isLocked

  const tabs = [
    { name: 'dashboard', link: 'workspace-dashboard' },
    { name: 'data', link: 'workspace-data' },
    ...(!isAnalysisTabVisible() ? [{ name: 'notebooks', link: 'workspace-notebooks' }] : []),
    // the spread operator results in no array entry if the config value is false
    // we want this feature gated until it is ready for release
    ...(isAnalysisTabVisible() ? [{ name: 'analyses', link: analysisTabName }] : []),
    { name: 'workflows', link: 'workspace-workflows' },
    { name: 'job history', link: 'workspace-job-history' }
  ]
  return h(Fragment, [
    h(TabBar, {
      'aria-label': 'workspace menu',
      activeTab, refresh,
      tabNames: _.map('name', tabs),
      getHref: currentTab => Nav.getLink(_.find({ name: currentTab }, tabs).link, { namespace, name })
    }, [
      isAnalysisTabVisible() ? h(Fragment) : h(WorkspaceMenuTrigger, { canShare, isLocked, namespace, name, isOwner, setCloningWorkspace, setSharingWorkspace, setTogglingWorkspaceLock, setDeletingWorkspace }, [
        h(Clickable, { 'aria-label': 'Workspace menu', ...navIconProps }, [icon('cardMenuIcon', { size: 27 })])
      ]
      )
    ])
  ])
}

const WorkspaceContainer = ({
  namespace, name, breadcrumbs, topBarContent, title, activeTab, showTabBar = true, refresh, refreshRuntimes, workspace,
  refreshWorkspace, runtimes, persistentDisks, appDataDisks, apps, refreshApps, location, locationType, children
}) => {
  const [deletingWorkspace, setDeletingWorkspace] = useState(false)
  const [cloningWorkspace, setCloningWorkspace] = useState(false)
  const [sharingWorkspace, setSharingWorkspace] = useState(false)
  const [togglingWorkspaceLock, setTogglingWorkspaceLock] = useState(false)

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({ style: Style.noWrapEllipsis }, breadcrumbs),
        h2({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          title || `${namespace}/${name}`,
          workspace && !Utils.canWrite(workspace.accessLevel) && span({ style: { paddingLeft: '0.5rem', color: colors.dark(0.85) } }, '(read only)'),
          workspace && workspace.workspace.isLocked && span({ style: { paddingLeft: '0.5rem', color: colors.dark(0.85) } }, '(locked)')
        ])
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
      namespace, name, activeTab, refresh, workspace, deletingWorkspace, setDeletingWorkspace, cloningWorkspace, setCloningWorkspace,
      sharingWorkspace, setSharingWorkspace, togglingWorkspaceLock, setTogglingWorkspaceLock
    }),
    div({ role: 'main', style: Style.elements.pageContentContainer },

      // TODO: When we switch this over to all tabs, ensure other workspace tabs look the same when inside these divs
      (isAnalysisTabVisible() && _.includes(activeTab, contextBarTabs) ?
        [div({ style: { flex: 1, display: 'flex' } }, [
          div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [
            children
          ]),
          workspace && h(ContextBar, {
            workspace, setDeletingWorkspace, setCloningWorkspace, setSharingWorkspace,
            setTogglingWorkspaceLock, apps, appDataDisks, refreshApps,
            runtimes, persistentDisks, refreshRuntimes, location, locationType
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
    togglingWorkspaceLock && h(LockWorkspaceModal, {
      workspace,
      onDismiss: () => setTogglingWorkspaceLock(false),
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

const useCloudEnvironmentPolling = googleProject => {
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
      const [newDisks, newRuntimes] = googleProject ? await Promise.all([
        Ajax(signal).Disks.list({ googleProject, creator: getUser().email, includeLabels: 'saturnApplication,saturnWorkspaceName' }),
        Ajax(signal).Runtimes.list({ googleProject, creator: getUser().email })
      ]) : [[], []]
      setRuntimes(newRuntimes)
      setAppDataDisks(_.remove(disk => _.isUndefined(getDiskAppType(disk)), newDisks))
      setPersistentDisks(_.filter(disk => _.isUndefined(getDiskAppType(disk)), newDisks))

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
      const newApps = googleProject ?
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
    const [{ location, locationType }, setBucketLocation] = useState({ location: defaultLocation, locationType: locationTypes.default })

    const prevGoogleProject = usePrevious(googleProject)
    const { runtimes, refreshRuntimes, persistentDisks, appDataDisks } = useCloudEnvironmentPolling(googleProject)
    const { apps, refreshApps } = useAppPolling(googleProject, name)
    if (googleProject !== prevGoogleProject) {
      refreshRuntimes()
      refreshApps()
    }

    const loadBucketLocation = async (googleProject, bucketName) => {
      const bucketLocation = await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketLocation(googleProject, bucketName)
      setBucketLocation(bucketLocation)
    }

    const refreshWorkspace = _.flow(
      withErrorReporting('Error loading workspace'),
      Utils.withBusyState(setLoadingWorkspace)
    )(async () => {
      try {
        const workspace = await Ajax(signal).Workspaces.workspace(namespace, name).details([
          'accessLevel', 'canCompute', 'canShare', 'owners',
          'workspace', 'workspace.attributes', 'workspace.authorizationDomain',
          'workspace.isLocked', 'workspaceSubmissionStats'
        ])
        workspaceStore.set(workspace)
        setGoogleProject(workspace.workspace.googleProject)

        const { accessLevel, workspace: { bucketName, createdBy, createdDate, googleProject } } = workspace

        loadBucketLocation(googleProject, bucketName)

        // Request a service account token. If this is the first time, it could take some time before everything is in sync.
        // Doing this now, even though we don't explicitly need it now, increases the likelihood that it will be ready when it is needed.
        if (Utils.canWrite(accessLevel)) {
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
      } else {
        const { workspace: { bucketName, googleProject } } = workspace
        loadBucketLocation(googleProject, bucketName)
      }
    })

    if (accessError) {
      return h(FooterWrapper, [h(TopBar), h(WorkspaceAccessError)])
    } else {
      return h(WorkspaceContainer, {
        namespace, name, activeTab, showTabBar, workspace, refreshWorkspace, runtimes, persistentDisks, appDataDisks, apps, refreshApps, location, locationType,
        title: _.isFunction(title) ? title(props) : title,
        breadcrumbs: breadcrumbs(props),
        topBarContent: topBarContent && topBarContent({ workspace, ...props }),
        refresh: async () => {
          await refreshWorkspace()
          if (child.current?.refresh) {
            child.current.refresh()
          }
        },
        refreshRuntimes
      }, [
        workspace && h(WrappedComponent, {
          ref: child,
          workspace, refreshWorkspace, refreshRuntimes, refreshApps, runtimes, persistentDisks, appDataDisks, apps,
          ...props
        }),
        loadingWorkspace && spinnerOverlay
      ])
    }
  }
  return withDisplayName('wrapWorkspace', Wrapper)
}

export const WorkspaceMenuTrigger = ({ children, canShare, isLocked, namespace, name, isOwner, setCloningWorkspace, setSharingWorkspace, setDeletingWorkspace, setTogglingWorkspaceLock }) => h(
  MenuTrigger, {
    closeOnClick: true,
    'aria-label': 'Workspace menu',
    content: h(Fragment, [
      h(MenuButton, { onClick: () => setCloningWorkspace(true) }, [makeMenuIcon('copy'), 'Clone']),
      h(MenuButton, {
        disabled: !canShare,
        tooltip: !canShare && 'You have not been granted permission to share this workspace',
        tooltipSide: 'left',
        onClick: () => setSharingWorkspace(true)
      }, [makeMenuIcon('share'), 'Share']),
      h(MenuButton, {
        disabled: !isOwner,
        tooltip: !isOwner && ['You have not been granted permission to ', isLocked ? 'unlock' : 'lock', ' this workspace'],
        tooltipSide: 'left',
        onClick: () => setTogglingWorkspaceLock(true)
      }, isLocked ? [makeMenuIcon('unlock'), 'Unlock'] : [makeMenuIcon('lock'), 'Lock']),
      h(MenuButton, {
        'aria-label': 'Workspace delete',
        disabled: !isOwner || isLocked,
        tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
        tooltipSide: 'left',
        onClick: () => setDeletingWorkspace(true)
      }, [makeMenuIcon('trash'), 'Delete Workspace'])
    ]),
    side: 'bottom'
  }, [children])
