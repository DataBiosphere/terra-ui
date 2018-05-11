import { Component } from 'react'
import { h, h2 } from 'react-hyperscript-helpers'
import * as Nav from 'src/libs/nav'
import * as Import from 'src/pages/Import'
import * as StyleGuide from 'src/pages/StyleGuide'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as WorkspaceContainer from 'src/pages/workspaces/workspace/Container'


const initNavPaths = () => {
  Nav.clearPaths()
  WorkspaceList.addNavPaths()
  WorkspaceContainer.addNavPaths()
  StyleGuide.addNavPaths()
  Import.addNavPaths()
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
    return h(handler.component, Nav.getHandlerProps(handler, pathname))
  }
}
