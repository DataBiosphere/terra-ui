import _ from 'lodash/fp'
import { createRef, Fragment, PureComponent } from 'react'
import { a, div, h, h2, p, span } from 'react-hyperscript-helpers'
import ClusterManager from 'src/components/ClusterManager'
import { buttonPrimary, Clickable, comingSoon, contextBar, link, MenuButton, menuIcon } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import PopupTrigger from 'src/components/PopupTrigger'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal'
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal'


const styles = {
  workspaceNameContainer: {
    display: 'flex', flexDirection: 'column',
    paddingLeft: '4rem', minWidth: 0, marginRight: '0.5rem'
  },
  workspaceName: {
    fontSize: '1.25rem', overflowX: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  childrenContainer: {
    position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column'
  },
  tabContainer: {
    paddingLeft: '5rem', borderBottom: `5px solid ${colors.blue[0]}`,
    color: 'white', textTransform: 'uppercase'
  },
  tab: {
    maxWidth: 140, flexGrow: 1, color: colors.gray[4],
    alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
    borderBottom: `4px solid ${colors.blue[0]}`, fontWeight: 'bold'
  }
}

const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const navIconProps = {
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}

const TAB_NAMES = ['dashboard', 'data', 'notebooks', 'tools', 'job history']

class WorkspaceTabs extends PureComponent {
  render() {
    const { namespace, name, workspace, activeTab, refresh, onShare, onDelete, onClone } = this.props
    const navTab = currentTab => {
      const selected = currentTab === activeTab
      const href = Nav.getLink(_.kebabCase(`workspace ${currentTab}`), { namespace, name })
      const hideSeparator = selected || TAB_NAMES.indexOf(activeTab) === TAB_NAMES.indexOf(currentTab) + 1

      return h(Fragment, [
        a({
          style: { ...styles.tab, ...(selected ? styles.activeTab : {}) },
          // some pages highlight a tab even when they're not on that url
          onClick: href === window.location.hash ? refresh : undefined,
          href
        }, currentTab),
        !hideSeparator && navSeparator
      ])
    }
    const isOwner = workspace && Utils.isOwner(workspace.accessLevel)

    return contextBar({ style: styles.tabContainer }, [
      activeTab !== TAB_NAMES[0] && navSeparator,
      ..._.map(name => navTab(name), TAB_NAMES),
      div({ style: { flexGrow: 1 } }),
      h(PopupTrigger, {
        closeOnClick: true,
        content: h(Fragment, [
          h(MenuButton, { onClick: onClone }, [menuIcon('copy'), 'Clone']),
          h(MenuButton, {
            disabled: !isOwner,
            tooltip: !isOwner && 'You must be an owner of this workspace or the underlying billing project',
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
        position: 'bottom'
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
      div({ style: styles.childrenContainer }, [
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


export const wrapWorkspace = ({ breadcrumbs, activeTab, title, topBarContent, showTabBar = true }) => WrappedComponent => {
  return ajaxCaller(class Wrapper extends Component {
    constructor(props) {
      super(props)
      this.child = createRef()
    }

    static displayName = 'wrapWorkspace()'

    render() {
      const { workspaceError } = this.state

      return workspaceError ? this.renderError() : this.renderSuccess()
    }

    renderSuccess() {
      const { namespace, name } = this.props
      const { workspace, clusters, loadingWorkspace } = this.state

      return h(WorkspaceContainer, {
        namespace, name, activeTab, showTabBar, workspace, clusters,
        title: _.isFunction(title) ? title(this.props) : title,
        breadcrumbs: breadcrumbs(this.props),
        topBarContent: topBarContent && topBarContent({ workspace, ...this.props }),
        refresh: async () => {
          await this.refresh()
          const child = this.child.current
          if (child.refresh) {
            child.refresh()
          }
        },
        refreshClusters: () => this.refreshClusters()
      }, [
        workspace && h(WrappedComponent, {
          ref: this.child,
          workspace, clusters, loadingWorkspace,
          refreshWorkspace: () => this.refresh(),
          refreshClusters: () => this.refreshClusters(),
          ...this.props
        })
      ])
    }

    renderError() {
      const { workspaceError, errorText } = this.state
      const groupURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9553'
      const authorizationURL = 'https://software.broadinstitute.org/firecloud/documentation/article?id=9524'

      return div({ style: { padding: '2rem' } }, [
        workspaceError.status === 404 ?
          h(Fragment, [
            h2({}, ['Could not display workspace']),
            p({},
              ['You are trying to access a workspace that either does not exist, or you do not have access to it.']),
            p({}, [
              'To view an existing workspace, the owner of the workspace must share it with you or with a ',
              link({ target: '_blank', href: groupURL }, 'Group'), ' of which you are a member. ',
              'If the workspace is protected under an ', link({ target: '_blank', href: authorizationURL }, 'Authorization Domain'),
              ', you must be a member of every group within the Authorization Domain.'
            ]),
            p({}, [
              'If you think the workspace exists but you do not have access, please contact the workspace owner.'
            ]),
            buttonPrimary({
              as: 'a',
              href: Nav.getLink('workspaces')
            }, ['Return to Workspace List'])
          ]) :
          h(Fragment, [
            h2({}, ['Failed to load workspace']),
            h(ErrorView, { error: errorText })
          ])
      ])
    }

    componentDidMount() {
      this.refresh()
      this.refreshClusters()
    }

    async refreshClusters() {
      const { namespace, ajax: { Jupyter } } = this.props
      try {
        const clusters = _.filter({ googleProject: namespace, creator: getUser().email }, await Jupyter.clustersList())
        this.setState({ clusters })
      } catch (error) {
        reportError('Error loading clusters', error)
      }
    }

    async refresh() {
      const { namespace, name, ajax: { Workspaces } } = this.props
      try {
        this.setState({ loadingWorkspace: true })
        const workspace = await Workspaces.workspace(namespace, name).details()
        this.setState({ workspace })
      } catch (error) {
        this.setState({ workspaceError: error, errorText: await error.text().catch(() => 'Unknown') })
      } finally {
        this.setState({ loadingWorkspace: false })
      }
    }
  })
}
