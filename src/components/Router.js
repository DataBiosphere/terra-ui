import { Component } from 'react'
import { h2 } from 'react-hyperscript-helpers'
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
    this.state = { windowHash: '' }
  }

  componentDidMount() {
    initNavPaths()
    this.handleHashChange()
    window.addEventListener('hashchange', this.handleHashChange)
  }

  componentWillReceiveProps() {
    initNavPaths()
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange)
  }

  handleHashChange = () => {
    if (!Nav.executeRedirects(window.location.hash)) {
      this.setState({ windowHash: window.location.hash })
    }
  }

  render() {
    const { windowHash } = this.state
    return Nav.renderPath(windowHash) || h2('No matching path.')
  }
}
