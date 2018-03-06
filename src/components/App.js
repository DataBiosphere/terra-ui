import update from 'immutability-helper'
import { Component, Fragment } from 'react'
import { a, div, h, h1, h2, nav } from 'react-hyperscript-helpers'
import * as WorkspaceDetails from 'src/components/workspaces/Details'
import * as WorkspaceList from 'src/components/workspaces/List'
import * as Config from 'src/config'
import * as Nav from 'src/nav'
import * as Style from 'src/style'
import * as Utils from 'src/utils'


const initNavPaths = () => {
  Nav.clearPaths()
  WorkspaceList.addNavPaths()
  WorkspaceDetails.addNavPaths()
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    initNavPaths()
    this.handleHashChange()
    Config.loadConfig().then(() => this.setState({ configLoaded: true }))
  }

  render() {
    const { configLoaded, isSignedIn } = this.state

    return h(Fragment, [
      configLoaded ?
        div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }) :
        h2('Loading config...'),
      isSignedIn ?
        this.renderSignedIn() :
        null])
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange)
    this.loadAuth()
  }

  componentWillReceiveProps() { initNavPaths() }

  componentWillUnmount() { window.removeEventListener('hashchange', this.handleHashChange) }

  loadAuth = () => {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init({
        clientId: Config.getGoogleClientId()
      }).then(() => {
        if (Utils.getUser().isSignedIn()) {this.setState({ isSignedIn: true })}

        Utils.getAuthInstance()
          .isSignedIn
          .listen(status => this.setState({ isSignedIn: status }))

        window.gapi.signin2.render('signInButton', {
          scope: 'profile email openid https://www.googleapis.com/auth/devstorage.full_control https://www.googleapis.com/auth/compute'
        })
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

    const makeNavLink = function(props, label) {
      return Style.addHoverStyle(a,
        update({
            style: {
              display: 'inline-block',
              padding: '5px 10px', marginTop: 10, marginRight: 10,
              backgroundColor: '#eee', borderRadius: 4,
              textDecoration: 'none'
            },
            hoverStyle: { color: '#039be5', backgroundColor: Style.colors.lightBluish }
          },
          { $merge: props }),
        label)
    }

    return h(Fragment, [
      a({
        style: { float: 'right' },
        href: windowHash,
        onClick: Utils.getAuthInstance().signOut
      }, 'Sign out'),
      h1({ style: { fontSize: '1.2em', color: '#999', marginBottom: 0 } },
        'Saturn UI'),
      nav({ style: { paddingTop: 10 } }, [
        makeNavLink({ href: Nav.getLink('workspaces') }, 'Workspace List'),
        makeNavLink({ href: '#list' }, 'Heroes')
      ]),
      div({ style: { paddingTop: 10 } }, [
        component ? component(makeProps()) : h2('No matching path.')
      ])
    ])
  }
}

export default () => h(App)
