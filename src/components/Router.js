import _ from 'lodash/fp'
import { Component } from 'react'
import { h, h2, div } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import PageWrapper from 'src/components/PageWrapper'
import { link } from 'src/components/common'
import * as Nav from 'src/libs/nav'
import * as ImportData from 'src/pages/ImportData'
import * as ImportTool from 'src/pages/ImportTool'
import * as PrivacyPolicy from 'src/pages/PrivacyPolicy'
import * as StyleGuide from 'src/pages/StyleGuide'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as Dashboard from 'src/pages/workspaces/workspace/Dashboard'
import * as Data from 'src/pages/workspaces/workspace/Data'
import * as Notebooks from 'src/pages/workspaces/workspace/Notebooks'
import * as NotebookLauncher from 'src/pages/workspaces/workspace/notebooks/NotebookLauncher'
import * as Tools from 'src/pages/workspaces/workspace/Tools'
import * as WorkflowView from 'src/pages/workspaces/workspace/tools/WorkflowView'
import * as Workflows from 'src/pages/workspaces/workspace/Workflows'


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
  Workflows.addNavPaths()
  Tools.addNavPaths()
  NotebookLauncher.addNavPaths()
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
    if (!handler) return

    if (handler.title) {
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
      return h(PageWrapper, [
        div({ style: { marginLeft: '1rem' } }, [
          h2('Page not found'),
          link({ href: Nav.getLink('root') }, 'Homepage')
        ])
      ])
    }

    const el = h(handler.component, {
      key: pathname, // forces a remount even if component is the same
      ...Nav.getHandlerProps(handler, pathname, search)
    })
    return h(PageWrapper, [handler.public ? el : h(AuthContainer, [el])])
  }
}
