import _ from 'underscore'
import update from 'immutability-helper'
import { Component, Fragment } from 'react'
import { a, div, h, h1, h2, nav } from 'react-hyperscript-helpers'
import * as Dashboard from './Dashboard'
import * as Nav from '../nav'
import * as Style from '../style'


const initNavPaths = () => {
  Nav.clearPaths()
  Dashboard.addNavPaths()
}

/*
* title - Title of app.
*/
class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  handleHashChange = () => {
    if (!Nav.executeRedirects(window.location.hash)) {
      this.setState(prevState =>
        update(prevState,
          {
            windowHash: { $set: window.location.hash },
            isLoaded: { $set: true } // FIXME: move when loading for real...
          })
      )
    }
  }

  componentWillMount() {
    initNavPaths()
    this.handleHashChange()
  }

  render() {
    const { windowHash, isLoaded } = this.state
    const { component, makeProps } = Nav.findPathHandler(windowHash) || {}

    const makeNavLink = function(props, label) {
      return Style.addHoverStyle(a,
        _.extend(
          {
            style: {
              display: 'inline-block',
              padding: '5px 10px', marginTop: 10, marginRight: 10,
              backgroundColor: '#eee', borderRadius: 4,
              textDecoration: 'none'
            },
            hoverStyle: { color: '#039be5', backgroundColor: Style.colors.lightBluish }
          },
          props),
        label)
    }

    let activeThing
    if (!isLoaded) {
      activeThing = h2({}, 'Loading heroes...')
    } else if (component) {
      activeThing = component(makeProps())
    }


    return h(Fragment, [
      h1({ style: { fontSize: '1.2em', color: '#999', marginBottom: 0 } },
        this.props.title),
      nav({ style: { paddingTop: 10 } }, [
        makeNavLink({ href: '#dashboard' }, 'Dashboard'),
        makeNavLink({ href: '#list' }, 'Heroes')
      ]),
      div({ style: { paddingTop: 10 } }, [
        activeThing
      ])
    ])
  }

  componentDidMount() {
    this.hashChangeListener = this.handleHashChange
    window.addEventListener('hashchange', this.hashChangeListener)
  }

  componentWillReceiveProps() { initNavPaths() }

  componentWillUnmount() { window.removeEventListener('hashchange', this.hashChangeListener) }
}

export default props => h(App, props)
