import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import { link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import * as Nav from 'src/libs/nav'
import * as BrowseData from 'src/pages/BrowseData'
import * as Group from 'src/pages/groups/Group'
import * as Groups from 'src/pages/groups/List'
import * as ImportData from 'src/pages/ImportData'
import * as ImportTool from 'src/pages/ImportTool'
import * as PrivacyPolicy from 'src/pages/PrivacyPolicy'
import * as Profile from 'src/pages/Profile'
import * as StyleGuide from 'src/pages/StyleGuide'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as Dashboard from 'src/pages/workspaces/workspace/Dashboard'
import * as Data from 'src/pages/workspaces/workspace/Data'
import * as JobHistory from 'src/pages/workspaces/workspace/JobHistory'
import * as Notebooks from 'src/pages/workspaces/workspace/Notebooks'
import * as NotebookLauncher from 'src/pages/workspaces/workspace/notebooks/NotebookLauncher'
import * as TerminalLauncher from 'src/pages/workspaces/workspace/notebooks/TerminalLauncher'
import * as Tools from 'src/pages/workspaces/workspace/Tools'
import * as WorkflowView from 'src/pages/workspaces/workspace/tools/WorkflowView'


const pageWrapStyle = { minHeight: 'calc(100% - 2rem)', flexGrow: 1, display: 'flex', flexDirection: 'column', marginBottom: '2rem' }

const initNavPaths = () => {
  Nav.clearPaths()
  WorkspaceList.addNavPaths()
  WorkflowView.addNavPaths()
  StyleGuide.addNavPaths()
  ImportData.addNavPaths()
  ImportTool.addNavPaths()
  PrivacyPolicy.addNavPaths()
  Dashboard.addNavPaths()
  Data.addNavPaths()
  Notebooks.addNavPaths()
  JobHistory.addNavPaths()
  Tools.addNavPaths()
  NotebookLauncher.addNavPaths()
  Profile.addNavPaths()
  Groups.addNavPaths()
  Group.addNavPaths()
  TerminalLauncher.addNavPaths()
  BrowseData.addNavPaths()
}

export default class Router extends Component {
  constructor(props) {
    super(props)
    this.state = { pathname: undefined }
  }

  componentDidMount() {
    initNavPaths()
    this.setState({ pathname: Nav.history.location.pathname, search: Nav.history.location.search })
    this.unlisten = Nav.history.listen(
      ({ pathname, search }) => this.setState({ pathname, search })
    )
  }

  componentWillReceiveProps() {
    initNavPaths()
  }

  componentDidUpdate(prevProps, prevState) {
    const { pathname, search } = this.state
    if (prevState.pathname === pathname) return

    const handler = Nav.findHandler(pathname)

    if (handler && handler.title) {
      if (_.isFunction(handler.title)) {
        document.title = handler.title(Nav.getHandlerProps(handler, pathname, search))
      } else {
        document.title = handler.title
      }
    } else {
      document.title = 'Saturn'
    }
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { pathname, search } = this.state
    if (pathname === undefined) {
      return null
    }
    const handler = Nav.findHandler(pathname)
    if (!handler) {
      return h(FooterWrapper, [
        div({ style: { marginLeft: '1rem', ...pageWrapStyle } }, [
          h2('Page not found'),
          link({ href: Nav.getLink('root') }, 'Homepage')
        ])
      ])
    }
    const el = div({ style: pageWrapStyle }, [
      h(handler.component, {
        key: pathname, // forces a remount even if component is the same
        ...Nav.getHandlerProps(handler, pathname, search)
      })
    ])
    return handler.public ? el : h(AuthContainer, [el])
  }
}
