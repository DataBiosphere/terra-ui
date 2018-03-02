import update from 'immutability-helper'
import { Component, Fragment } from 'react'
import { a, div, h, h1, h2, nav } from 'react-hyperscript-helpers'
import * as Nav from '../nav'
import * as Style from '../style'
import * as Utils from '../utils'
import * as WorkspaceDetails from './workspaces/Details'
import * as WorkspaceList from './workspaces/List'


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

  handleHashChange = () => {
    if (!Nav.executeRedirects(window.location.hash)) {
      this.setState({
          windowHash: window.location.hash
        }
      )
    }
  }

  componentWillMount() {
    initNavPaths()
    this.handleHashChange()
  }

  renderSignedIn = () => {
    const { windowHash, isLoaded } = this.state
    const { component, makeProps } = Nav.findPathHandler(windowHash) || {}

    const makeNavLink = function(props, label) {
      return Style.addHoverStyle(a,
        update(
          {
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

    let activeThing = null
    if (!isLoaded) {
      activeThing = h2({}, 'Loading stuff...')
    } else if (component) {
      activeThing = component(makeProps())
    }


    return h(Fragment, [
      a({
        style: { float: 'right' },
        href: windowHash,
        onClick: () => {Utils.getAuthInstance().signOut()}
      }, 'Sign out'),
      h1({ style: { fontSize: '1.2em', color: '#999', marginBottom: 0 } },
        'Saturn UI'),
      nav({ style: { paddingTop: 10 } }, [
        makeNavLink({ href: Nav.getLink('workspaces') }, 'Workspace List'),
        makeNavLink({ href: '#list' }, 'Heroes')
      ]),
      div({ style: { paddingTop: 10 } }, [
        activeThing
      ])
    ])

  }

  render() {
    const { isSignedIn } = this.state

    return h(Fragment, [
      div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }),
      isSignedIn ? this.renderSignedIn() : null])
  }

  componentDidMount() {
    this.hashChangeListener = this.handleHashChange
    window.addEventListener('hashchange', this.hashChangeListener)
    window.gapi.load('auth2', () => {
      window.gapi.auth2.init(
        { clientId: '500025638838-s2v23ar3spugtd5t2v1vgfa2sp7ppg0d.apps.googleusercontent.com' })
        .then(() => {
          Utils.getAuthInstance().isSignedIn.listen(status => this.setState({ isSignedIn: status }))

          if (Utils.getUser().isSignedIn()) {
            this.setState({ isSignedIn: true })
          } else {
            window.gapi.signin2.render('signInButton', {
              scope: 'profile email openid https://www.googleapis.com/auth/devstorage.full_control https://www.googleapis.com/auth/compute'
            })
          }
          this.setState({ isLoaded: true })
        })
    })

  }

  componentWillReceiveProps() { initNavPaths() }

  componentWillUnmount() { window.removeEventListener('hashchange', this.hashChangeListener) }
}

export default () => h(App)
