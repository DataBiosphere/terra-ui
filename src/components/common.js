import mixinDeep from 'mixin-deep'
import { Component } from 'react'
import { createPortal } from 'react-dom'
import { a, div, h, input, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import _ from 'underscore'
import { icon } from 'src/icons'
import * as Style from 'src/style'
import * as Utils from 'src/utils'
import * as Nav from 'src/nav'


const link = function(props, children) {
  return h(Interactive,
    mixinDeep({
      as: 'a',
      style: {
        textDecoration: 'none',
        color: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      },
      hover: props.disabled ? null : { color: Style.colors.primary }
    }, props),
    children)
}

const card = function(props, children) {
  return div(mixinDeep({
      style: {
        borderRadius: 5, padding: '1rem', wordWrap: 'break-word',
        backgroundColor: 'white',
        boxShadow: '0 0 2px 0 rgba(0,0,0,0.12), 0 3px 2px 0 rgba(0,0,0,0.12)'
      }
    }, props),
    children)
}

const buttonPrimary = function(props, children) {
  return h(Interactive,
    mixinDeep({
      style: _.extend({
        padding: '2rem 0.5rem', borderRadius: 5,
        color: 'white',
        backgroundColor: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      }, Style.elements.button),
      hover: props.disabled ? null : { backgroundColor: Style.colors.primary }
    }, props),
    children)
}

const search = function({ wrapperProps = {}, inputProps = {} }) {
  return div(
    mixinDeep({ style: { borderBottom: '1px solid black', padding: '0.5rem 0', display: 'flex' } },
      wrapperProps),
    [
      icon('search'),
      input(mixinDeep({
        style: {
          border: 'none', outline: 'none',
          flexGrow: 1,
          verticalAlign: 'bottom', marginLeft: '1rem'
        }
      }, inputProps))
    ])
}

const topBar = children => h(TopBarConstructor, children)

class TopBarConstructor extends Component {
  constructor(props) {
    super(props)
    this.state = { navShown: false }
  }

  render() {
    const hideNav = () => {
      this.setState({ navShown: false })
      document.body.classList.remove('overlayOpen')
    }

    const sideNav = createPortal(
      div(
        {
          style: {
            display: 'flex', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            overflow: 'auto'
          }
        },
        [
          div({
            style: {
              boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)', width: 200,
              backgroundColor: Style.colors.primary,
              position: 'fixed', height: '100%'
            }
          }),
          div({ style: { width: 200, color: 'white', position: 'absolute' } }, [
            div({
              style: _.extend({
                  height: '3rem', lineHeight: '3rem', backgroundColor: 'white', padding: '1rem',
                  textAlign: 'center'
                },
                Style.elements.pageTitle)
            }, 'Saturn'),
            div({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white'
              }
            }, [icon('search', { style: { margin: '0 1rem 0 1rem' } }), 'Find Data']),
            div({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white'
              }
            }, [icon('search', { style: { margin: '0 1rem 0 1rem' } }), 'Find Code']),
            a({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white',
                textDecoration: 'none', display: 'block'
              },
              href: Nav.getLink('workspaces'),
              onClick: hideNav
            }, [
              icon('grid-view', { class: 'is-solid', style: { margin: '0 1rem 0 1rem' } }),
              'Projects'
            ])
          ]),
          div({
            style: { flexGrow: 1, cursor: 'pointer' },
            onClick: hideNav
          })
        ]),
      document.getElementById('main-menu-container')
    )

    return div(
      {
        style: {
          backgroundColor: 'white', height: '3rem', padding: '1rem',
          display: 'flex', alignItems: 'center'
        }
      },
      [
        icon('bars',
          {
            size: 36, style: { marginRight: '2rem', color: Style.colors.accent, cursor: 'pointer' },
            onClick: () => {
              this.setState({ navShown: true })
              document.body.classList.add('overlayOpen')
            }
          }),
        span({ style: Style.elements.pageTitle }, 'Saturn'),
        this.props.children,
        div({ style: { flexGrow: 1 } }),
        link({
          onClick: Utils.getAuthInstance().signOut
        }, 'Sign out'),
        this.state.navShown ? sideNav : null
      ]
    )

  }
}

const contextBar = function(props = {}, children = []) {
  return div(mixinDeep({
      style: {
        display: 'flex', alignItems: 'center', backgroundColor: Style.colors.primary,
        color: Style.colors.textAlt, fontWeight: 500,
        height: '1.5rem', padding: '1rem'
      }
    }, props),
    children)
}

export { card, link, search, buttonPrimary, topBar, contextBar }
