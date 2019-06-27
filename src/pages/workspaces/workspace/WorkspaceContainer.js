import _ from 'lodash/fp'
import { Fragment, PureComponent, useRef, useState } from 'react'
import { div, h, h2, p, span } from 'react-hyperscript-helpers'
import ClusterManager from 'src/components/ClusterManager'
import { buttonPrimary, Clickable, comingSoon, link, MenuButton, menuIcon, tabBar } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { clearNotification, notify } from 'src/components/Notifications'
import PopupTrigger from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { contactUsActive, workspaceStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const navIconProps = {
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}

const TAB_NAMES = ['dashboard', 'data', 'notebooks', 'tools', 'job history']

class WorkspaceTabs extends PureComponent {
  render() {
    const { namespace, name, workspace, activeTab, refresh, onShare, onDelete, onClone } = this.props
    const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
    const canShare = workspace && workspace.canShare

    return tabBar({
      activeTab, refresh,
      tabNames: TAB_NAMES,
      getHref: currentTab => Nav.getLink(_.kebabCase(`workspace ${currentTab}`), { namespace, name })
    }, [
      h(PopupTrigger, {
        closeOnClick: true,
        content: h(Fragment, [
          h(MenuButton, { onClick: onClone }, [menuIcon('copy'), 'Clone']),
          h(MenuButton, {
            disabled: !canShare,
            tooltip: !canShare && 'You have not been granted permission to share this workspace',
            tooltipSide: 'left',
            onClick: () => onShare()
          }, [menuIcon('share'), 'Share']),
          h(MenuButton, { disabled: true }, [menuIcon('export'), 'Publish', comingSoon]),
          h(MenuButton, {
            disabled: !isOwner,
            tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
            tooltipSide: 'left',
            onClick: () => onDelete()
          }, [menuIcon('trash'), 'Delete Workspace'])
        ]),
        side: 'bottom'
      }, [
        h(Clickable, { ...navIconProps }, [icon('cardMenuIcon', { size: 27 })])
      ])
    ])
  }
}


class WorkspaceContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deletingWorkspace: false,
      cloningWorkspace: false
    }
  }

  onDelete = () => {
    this.setState({ deletingWorkspace: true })
  }

  onClone = () => {
    this.setState({ cloningWorkspace: true })
  }

  onShare = () => {
    this.setState({ sharingWorkspace: true })
  }

  render() {
    const { namespace, name, breadcrumbs, topBarContent, title, activeTab, showTabBar = true, refresh, refreshClusters, workspace, clusters } = this.props
    const { deletingWorkspace, cloningWorkspace, sharingWorkspace } = this.state
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
      showTabBar && h(WorkspaceTabs, {
        namespace, name, activeTab, refresh, workspace,
        onDelete: this.onDelete, onClone: this.onClone, onShare: this.onShare
      }),
      div({ style: Style.elements.pageContentContainer }, [
        this.props.children
      ]),
      deletingWorkspace && h(DeleteWorkspaceModal, {
        workspace,
        onDismiss: () => this.setState({ deletingWorkspace: false }),
        onSuccess: () => Nav.goToPath('workspaces')
      }),
      cloningWorkspace && h(NewWorkspaceModal, {
        cloneWorkspace: workspace,
        onDismiss: () => this.setState({ cloningWorkspace: false }),
        onSuccess: ({ namespace, name }) => Nav.goToPath('workspace-dashboard', { namespace, name })
      }),
      sharingWorkspace && h(ShareWorkspaceModal, {
        workspace,
        onDismiss: () => this.setState({ sharingWorkspace: false })
      })
    ])
  }
}


const WorkspaceAccessError = () => {
  const groupURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9553'
  const authorizationURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'
  return div({ style: { padding: '2rem' } }, [
    h2(['Could not display workspace']),
    p(['You are trying to access a workspace that either does not exist, or you do not have access to it.']),
    p([
      'To view an existing workspace, the owner of the workspace must share it with you or with a ',
      link({ ...Utils.newTabLinkProps, href: groupURL }, 'Group'), ' of which you are a member. ',
      'If the workspace is protected under an ', link({ ...Utils.newTabLinkProps, href: authorizationURL }, 'Authorization Domain'),
      ', you must be a member of every group within the Authorization Domain.'
    ]),
    p(['If you think the workspace exists but you do not have access, please contact the workspace owner.']),
    buttonPrimary({
      as: 'a',
      href: Nav.getLink('workspaces')
    }, ['Return to Workspace List'])
  ])
}

const checkBucketAccess = withErrorReporting('Error checking bucket access', async (signal, namespace, name) => {
  try {
    await Ajax(signal).Workspaces.workspace(namespace, name).checkBucketReadAccess()
    return true
  } catch (error) {
    if (error.status === 403) {
      const notificationId = 'bucket-access-unavailable'

      notify('error', div([
        'The Google Bucket associated with this workspace is currently unavailable. This should be resolved shortly.',
        div({ style: { margin: '0.5rem' } }),
        'If this persists for more than an hour, please ',
        link({
          onClick: () => {
            contactUsActive.set(true)
            clearNotification(notificationId)
          },
          style: { color: 'white' },
          hover: {
            color: 'white',
            textDecoration: 'underline'
          }
        }, ['contact us', icon('pop-out', { size: 10, style: { marginLeft: '0.25rem' } })]),
        ' for assistance.'
      ]), { id: notificationId })
    } else {
      throw error
    }
    return false
  }
})


export const wrapWorkspace = ({ breadcrumbs, activeTab, title, topBarContent, showTabBar = true, queryparams }) => WrappedComponent => {
  const Wrapper = props => {
    const { namespace, name } = props
    const child = useRef()
    const signal = useCancellation()
    const [accessError, setAccessError] = useState(false)
    const cachedWorkspace = Utils.useAtom(workspaceStore)
    const [loadingWorkspace, setLoadingWorkspace] = useState(false)
    const [clusters, setClusters] = useState(undefined)
    const workspace = cachedWorkspace && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedWorkspace.workspace)) ? cachedWorkspace : undefined

    const refreshClusters = withErrorReporting('Error loading clusters', async () => {
      const clusters = await Ajax(signal).Jupyter.clustersList(namespace)
      setClusters(_.filter({ creator: getUser().email }, clusters))
    })

    const refreshWorkspace = _.flow(
      withErrorReporting('Error loading workspace'),
      Utils.withBusyState(setLoadingWorkspace)
    )(async () => {
      try {
        const workspace = await Ajax(signal).Workspaces.workspace(namespace, name).details()
        const res = await checkBucketAccess(signal, namespace, name)
        workspaceStore.set({ hasBucketAccess: res, ...workspace })
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
      refreshClusters()
    })

    if (accessError) {
      return h(WorkspaceAccessError)
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
          workspace, loadingWorkspace, refreshWorkspace, refreshClusters,
          cluster: !clusters ? undefined : (_.flow(Utils.trimClustersOldestFirst, _.remove({ status: 'Error' }), _.last)(clusters) || null),
          ...props
        })
      ])
    }
  }
  Wrapper.displayName = 'wrapWorkspace()'
  return Wrapper
}
