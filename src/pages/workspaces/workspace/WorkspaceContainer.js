import { differenceInSeconds } from 'date-fns'
import _ from 'lodash/fp'
import { Fragment, useRef, useState } from 'react'
import { div, h, h2, p, span } from 'react-hyperscript-helpers'
import ClusterManager from 'src/components/ClusterManager'
import { ButtonPrimary, Clickable, comingSoon, Link, makeMenuIcon, MenuButton, spinnerOverlay, TabBar } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { clearNotification, notify } from 'src/components/Notifications'
import PopupTrigger from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax, saToken, useCancellation } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import { currentCluster } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { workspaceStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const navIconProps = {
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}

const WorkspaceTabs = ({ namespace, name, workspace, activeTab, refresh }) => {
  const [deletingWorkspace, setDeletingWorkspace] = useState(false)
  const [cloningWorkspace, setCloningWorkspace] = useState(false)
  const [sharingWorkspace, setSharingWorkspace] = useState(false)
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  const canShare = workspace && workspace.canShare

  const tabs = [
    { name: 'dashboard', link: 'workspace-dashboard' },
    { name: 'data', link: 'workspace-data' },
    { name: 'notebooks', link: 'workspace-notebooks' },
    { name: 'workflows', link: 'workspace-workflows' },
    { name: 'job history', link: 'workspace-job-history' }
  ]
  return h(Fragment, [
    h(TabBar, {
      activeTab, refresh,
      tabNames: _.map('name', tabs),
      getHref: currentTab => Nav.getLink(_.find({ name: currentTab }, tabs).link, { namespace, name })
    }, [
      h(PopupTrigger, {
        closeOnClick: true,
        content: h(Fragment, [
          h(MenuButton, { onClick: () => setCloningWorkspace(true) }, [makeMenuIcon('copy'), 'Clone']),
          h(MenuButton, {
            disabled: !canShare,
            tooltip: !canShare && 'You have not been granted permission to share this workspace',
            tooltipSide: 'left',
            onClick: () => setSharingWorkspace(true)
          }, [makeMenuIcon('share'), 'Share']),
          h(MenuButton, { disabled: true }, [makeMenuIcon('export'), 'Publish', comingSoon]),
          h(MenuButton, {
            disabled: !isOwner,
            tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
            tooltipSide: 'left',
            onClick: () => setDeletingWorkspace(true)
          }, [makeMenuIcon('trash'), 'Delete Workspace'])
        ]),
        side: 'bottom'
      }, [
        h(Clickable, { 'aria-label': 'Workspace menu', ...navIconProps }, [icon('cardMenuIcon', { size: 27 })])
      ])
    ]),
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
    sharingWorkspace && h(ShareWorkspaceModal, {
      workspace,
      onDismiss: () => setSharingWorkspace(false)
    })
  ])
}

const WorkspaceContainer = ({ namespace, name, breadcrumbs, topBarContent, title, activeTab, showTabBar = true, refresh, refreshClusters, workspace, clusters, children }) => {
  return h(Fragment, [
    h(TopBar, { title: 'Workspaces', href: Nav.getLink('workspaces') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({}, breadcrumbs),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          title || `${namespace}/${name}`,
          workspace && !Utils.canWrite(workspace.accessLevel) && span({ style: { paddingLeft: '0.5rem', color: colors.dark(0.85) } }, '(read only)')
        ])
      ]),
      topBarContent,
      h(ClusterManager, {
        namespace, name, clusters, refreshClusters,
        canCompute: !!((workspace && workspace.canCompute) || (clusters && clusters.length))
      })
    ]),
    showTabBar && h(WorkspaceTabs, { namespace, name, activeTab, refresh, workspace }),
    div({ role: 'main', style: Style.elements.pageContentContainer }, [children])
  ])
}


const WorkspaceAccessError = () => {
  const groupURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9553'
  const authorizationURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'
  return div({ style: { padding: '2rem' } }, [
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

const useClusterPolling = namespace => {
  const signal = useCancellation()
  const timeout = useRef()
  const [clusters, setClusters] = useState()
  const reschedule = ms => {
    clearTimeout(timeout.current)
    timeout.current = setTimeout(refreshClustersSilently, ms)
  }
  const loadClusters = async () => {
    try {
      const newClusters = await Ajax(signal).Jupyter.clustersList(namespace)
      setClusters(_.filter({ creator: getUser().email }, newClusters))
      const cluster = currentCluster(newClusters)
      reschedule(_.includes(cluster && cluster.status, ['Creating', 'Starting', 'Stopping']) ? 10000 : 120000)
    } catch (error) {
      reschedule(30000)
      throw error
    }
  }
  const refreshClusters = withErrorReporting('Error loading clusters', loadClusters)
  const refreshClustersSilently = withErrorIgnoring(loadClusters)
  Utils.useOnMount(() => {
    refreshClusters()
    return () => clearTimeout(timeout.current)
  })
  return { clusters, refreshClusters }
}

export const wrapWorkspace = ({ breadcrumbs, activeTab, title, topBarContent, showTabBar = true, queryparams }) => WrappedComponent => {
  const Wrapper = props => {
    const { namespace, name } = props
    const child = useRef()
    const signal = useCancellation()
    const [accessError, setAccessError] = useState(false)
    const accessNotificationId = useRef()
    const cachedWorkspace = Utils.useAtom(workspaceStore)
    const [loadingWorkspace, setLoadingWorkspace] = useState(false)
    const { clusters, refreshClusters } = useClusterPolling(namespace)
    const workspace = cachedWorkspace && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedWorkspace.workspace)) ?
      cachedWorkspace :
      undefined

    const refreshWorkspace = _.flow(
      withErrorReporting('Error loading workspace'),
      Utils.withBusyState(setLoadingWorkspace)
    )(async () => {
      try {
        const workspace = await Ajax(signal).Workspaces.workspace(namespace, name).details()
        workspaceStore.set(workspace)

        const { accessLevel, workspace: { createdBy, createdDate } } = workspace

        // Request a service account token. If this is the first time, it could take some time before everything is in sync.
        // Doing this now, even though we don't explicitly need it now, increases the likelihood that it will be ready when it is needed.
        if (Utils.canWrite(accessLevel)) {
          saToken(namespace)
        }

        if (!Utils.isOwner(accessLevel) && (createdBy === getUser().email) && (differenceInSeconds(new Date(createdDate), new Date()) < 60)) {
          accessNotificationId.current = notify('info', 'Workspace access synchronizing', {
            message: h(Fragment, [
              'It looks like you just created this workspace. It may take up to a minute before you have access to modify it. Refresh at any time to re-check.',
              div({ style: { marginTop: '1rem' } }, [h(Link, {
                variant: 'light',
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

    Utils.useOnMount(() => {
      if (!workspace) {
        refreshWorkspace()
      }
    })

    if (accessError) {
      return h(Fragment, [h(TopBar), h(WorkspaceAccessError)])
    } else {
      return h(WorkspaceContainer, {
        namespace, name, activeTab, showTabBar, workspace, clusters,
        title: _.isFunction(title) ? title(props) : title,
        breadcrumbs: breadcrumbs(props),
        topBarContent: topBarContent && topBarContent({ workspace, ...props }),
        refresh: async () => {
          await refreshWorkspace()
          if (child.current.refresh) {
            child.current.refresh()
          }
        },
        refreshClusters
      }, [
        workspace && h(WrappedComponent, {
          ref: child,
          workspace, refreshWorkspace, refreshClusters,
          cluster: !clusters ? undefined : (currentCluster(clusters) || null),
          ...props
        }),
        loadingWorkspace && spinnerOverlay
      ])
    }
  }
  Wrapper.displayName = 'wrapWorkspace()'
  return Wrapper
}
