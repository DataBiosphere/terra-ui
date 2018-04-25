import { hot } from 'react-hot-loader'
import { div, h2 } from 'react-hyperscript-helpers'
import * as Config from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component, Fragment } from 'src/libs/wrapped-components'
import * as WorkspaceList from 'src/pages/workspaces/List'
import * as WorkspaceContainer from 'src/pages/workspaces/workspace/Container'


const initNavPaths = () => {
  Nav.clearPaths()
  WorkspaceList.addNavPaths()
  WorkspaceContainer.addNavPaths()
}

export default hot(module)(class Main extends Component {
  componentWillMount() {
    initNavPaths()
    this.handleHashChange()
    Config.loadConfig().then(() => this.loadAuth())
  }

  render() {
    const { isSignedIn } = this.state

    return Fragment([
      div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }),
      isSignedIn ?
        this.renderSignedIn() :
        null
    ])
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange)
  }

  componentWillReceiveProps() { initNavPaths() }

  componentWillUnmount() { window.removeEventListener('hashchange', this.handleHashChange) }

  loadAuth = () => {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        clientId: Config.getGoogleClientId()
      }).then(() => {
        if (Utils.getUser().isSignedIn()) {this.setState({ isSignedIn: true })}

        Utils.getAuthInstance().isSignedIn.listen(status => this.setState({ isSignedIn: status }))

        window.gapi.signin2.render('signInButton', { scope: 'openid profile email' })
      })
    })
  }

  handleHashChange = () => {
    if (!Nav.executeRedirects(window.location.hash)) {
      this.setState({ windowHash: window.location.hash })
    }
  }

  renderSignedIn = () => {
    const { windowHash } = this.state
    const { component, makeProps } = Nav.findPathHandler(windowHash) || {}

    return component ? component(makeProps()) : h2('No matching path.')
  }
})
