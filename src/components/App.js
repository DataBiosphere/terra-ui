import update from 'immutability-helper'
import { Component, Fragment } from 'react'
/* eslint-disable no-unused-vars */
// noinspection ES6UnusedImports
import {
  a, button, code, div, em, h, h1, h2, h3, h4, input, label, li, nav, ol, option, p, select, span,
  strong, style, textarea, ul
} from 'react-hyperscript-helpers'
/* eslint-enable no-unused-vars */
import * as WorkspaceDetails from 'src/components/workspaces/Details'
import * as WorkspaceList from 'src/components/workspaces/List'
import * as Config from 'src/config'
import * as Nav from 'src/nav'
import * as Style from 'src/style'
import * as Utils from 'src/utils'
import { icon } from 'src/icons'
import { link, search } from 'src/components/common'


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
    Config.loadConfig().then(() => this.loadAuth())
  }

  render() {
    const { isSignedIn } = this.state

    return h(Fragment, [
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

        Utils.getAuthInstance()
          .isSignedIn
          .listen(status => this.setState({ isSignedIn: status }))

        window.gapi.signin2.render('signInButton', {
          scope: [
            'profile', 'email', 'openid',
            'https://www.googleapis.com/auth/devstorage.full_control',
            'https://www.googleapis.com/auth/compute'
          ].join(' ')
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
            hoverStyle: { color: '#039be5' }
          },
          { $merge: props }),
        label)
    }

    return h(Fragment, [
      div(
        {
          style: {
            backgroundColor: 'white', height: '4rem', padding: '1rem',
            display: 'flex', alignItems: 'center'
          }
        },
        [
          icon('bars',
            { size: 36, style: { marginRight: '2rem', color: Style.colors.accent } }),
          span({ style: Style.elements.pageTitle },
            'Saturn'),
          div({ style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } }, [
            search({ placeholder: 'SEARCH BIOSPHERE' })
          ]),
          div({ style: { flexGrow: 1 } }),
          link({
            href: windowHash,
            onClick: Utils.getAuthInstance().signOut
          }, 'Sign out')
        ]
      ),
      div({ style: { backgroundColor: Style.colors.primary, height: '2rem', padding: '1rem' } }),
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
