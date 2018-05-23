import { Component } from 'react'
import { h, h2 } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import PageWrapper from 'src/components/PageWrapper'
import * as Nav from 'src/libs/nav'
import * as ImportData from 'src/pages/ImportData'
import * as ImportTool from 'src/pages/ImportTool'
import * as PrivacyPolicy from 'src/pages/PrivacyPolicy'
import * as StyleGuide from 'src/pages/StyleGuide'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as Dashboard from 'src/pages/workspaces/workspace/Dashboard'
import * as Data from 'src/pages/workspaces/workspace/Data'
import * as Notebooks from 'src/pages/workspaces/workspace/Notebooks'
import * as Tools from 'src/pages/workspaces/workspace/Tools'
import * as WorkflowView from 'src/pages/workspaces/workspace/tools/WorkflowView'


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
  Tools.addNavPaths()
}

export default class Router extends Component {
  constructor(props) {
    super(props)
    this.state = { pathname: undefined }
  }

  componentDidMount() {
    initNavPaths()
    this.setState({ pathname: Nav.history.location.pathname })
    this.unlisten = Nav.history.listen(({ pathname }) => this.setState({ pathname }))
  }

  componentWillReceiveProps() {
    initNavPaths()
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { pathname } = this.state
    if (pathname === undefined) {
      return null
    }
    const handler = Nav.findHandler(pathname)
    if (!handler) {
      return h2('No matching path.')
    }
    const el = h(handler.component, Nav.getHandlerProps(handler, pathname))
    return h(PageWrapper, [handler.public ? el : h(AuthContainer, [el])])
  }
}
