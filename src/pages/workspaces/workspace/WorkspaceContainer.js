import _ from 'lodash/fp'
import { Fragment, PureComponent, useRef, useState } from 'react'
import { div, h, h2, p, span } from 'react-hyperscript-helpers'
import { toClass } from 'recompose'
import ClusterManager from 'src/components/ClusterManager'
import { buttonPrimary, Clickable, comingSoon, link, MenuButton, menuIcon, tabBar } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { Ajax, useCancellation } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const workspaceStore = Utils.atom(undefined)

const styles = {
  workspaceNameContainer: {
    display: 'flex', flexDirection: 'column',
    paddingLeft: '4rem', minWidth: 0, marginRight: '0.5rem'
  },
  workspaceName: {
    color: 'white',
    fontSize: '1.25rem', overflowX: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  }
}

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
          }, [menuIcon('trash'), 'Delete'])
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
        div({ style: styles.workspaceNameContainer }, [
          div({}, breadcrumbs),
          div({ style: styles.workspaceName }, [
            title || `${namespace}/${name}`,
            workspace && !Utils.canWrite(workspace.accessLevel) && span({ style: { paddingLeft: '0.5rem', color: colors.gray[1] } }, '(read only)')
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
        namespace, name,
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
      link({ target: '_blank', href: groupURL }, 'Group'), ' of which you are a member. ',
      'If the workspace is protected under an ', link({ target: '_blank', href: authorizationURL }, 'Authorization Domain'),
      ', you must be a member of every group within the Authorization Domain.'
    ]),
    p(['If you think the workspace exists but you do not have access, please contact the workspace owner.']),
    buttonPrimary({
      as: 'a',
      href: Nav.getLink('workspaces')
    }, ['Return to Workspace List'])
  ])
}


export const wrapWorkspace = ({ breadcrumbs, activeTab, title, topBarContent, showTabBar = true, queryparams }) => WrappedComponent => {
  const WrappedClassComponent = toClass(WrappedComponent)

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
        workspaceStore.set(workspace)
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
        workspace && h(WrappedClassComponent, {
          ref: child,
          workspace, clusters, loadingWorkspace, refreshWorkspace, refreshClusters,
          ...props
        })
      ])
    }
  }
  Wrapper.displayName = 'wrapWorkspace()'
  return Wrapper
}
