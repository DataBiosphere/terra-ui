import _ from 'underscore'
import { Component, Fragment } from 'react'
import { a, div, h, h1, h2, nav } from 'react-hyperscript-helpers'
import * as Style from '../style'
import * as Nav from '../nav'
import update from 'immutability-helper'


const initNavPaths = () => {
  Nav.clearPaths()
}

/*
* title - Title of app.
*/
class Main extends Component {
  handleHashChange() {
    if (!Nav.executeRedirects(window.location.hash))
      this.setState(prevState => update(prevState,
        { windowHash: { $set: window.location.hash } }))
  }

  static componentWillMount() {
    initNavPaths()
    this.handleHashChange()
  }

  render() {
    const { windowHash, isLoaded } = this.state
    const { component, makeProps } = Nav.findPathHandler(windowHash)

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
    if (!isLoaded)
      activeThing = h2({}, 'Loading heroes...')
    else if (component)
      activeThing = component(makeProps())


    return h(Fragment, [
      h1({ style: { fontSize: '1.2em', color: '#999', marginBottom: 0 } },
        this.props.title),
      nav({ style: { paddingTop: 10 } }, [
        makeNavLink({ href: '#dashboard' }, 'Dashboard'),
        makeNavLink({ href: '#list' }, 'Heroes')
      ]),
      div({ style: { paddingTop: 10 } },
        activeThing)
    ])
  }
}

export default props => h(Main, props)
