import _ from 'lodash'
import mixinDeep from 'mixin-deep'
import { Component } from 'react'
import { createPortal } from 'react-dom'
import { a, div, h, hh, input } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { icon, logo } from 'src/components/icons'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export const link = function(props, children) {
  return h(Interactive,
    mixinDeep({
      as: 'a',
      style: {
        textDecoration: 'none',
        color: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      },
      hover: props.disabled ? undefined : { color: Style.colors.primary }
    }, props),
    children)
}

export const card = function(props, children) {
  return div(mixinDeep({
      style: {
        borderRadius: 5, padding: '1rem', wordWrap: 'break-word',
        backgroundColor: 'white',
        boxShadow: Style.standardShadow
      }
    }, props),
    children)
}

export const buttonPrimary = function(props, children) {
  return h(Interactive,
    mixinDeep({
      as: 'div',
      style: _.assign({
        padding: '0.5rem 2rem', borderRadius: 5,
        backgroundColor: props.disabled ? Style.colors.disabled : Style.colors.secondary,
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      }, Style.elements.button),
      hover: props.disabled ? undefined : { backgroundColor: Style.colors.primary }
    }, props),
    children)
}

export const search = function({ wrapperProps, inputProps }) {
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

/**
 * @param {string} title
 * @param {array} [children]
 */
export const TopBar = hh(class TopBar extends Component {
  constructor(props) {
    super(props)
    this.state = { navShown: false }
  }

  showNav() {
    this.setState({ navShown: true })
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  hideNav() {
    this.setState({ navShown: false })
    document.body.classList.remove('overlayOpen', 'overHeight')
  }

  buildNav() {
    return createPortal(
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
              boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)', width: 275,
              backgroundColor: Style.colors.primary,
              position: 'fixed', height: '100%'
            }
          }),
          div({ style: { width: 275, color: 'white', position: 'absolute' } }, [
            div({
              style: _.assign({
                  height: '3rem', lineHeight: '3rem', backgroundColor: 'white', padding: '1rem',
                  textAlign: 'center', display: 'flex', alignItems: 'center'
                },
                Style.elements.pageTitle)
            }, [
              icon('bars',
                {
                  dir: 'right',
                  size: 36,
                  style: { marginRight: '2rem', color: Style.colors.accent, cursor: 'pointer' },
                  onClick: () => this.hideNav()
                }),
              a({
                style: _.assign({
                    height: '3rem', textAlign: 'center', display: 'flex', alignItems: 'center'
                  },
                  Style.elements.pageTitle),
                href: Nav.getLink('workspaces'),
                onClick: () => this.hideNav()
              }, [logo(), 'Saturn'])
            ]),
            div({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white', lineHeight: '1.5rem'
              }
            }, [icon('search', { style: { margin: '0 1rem 0 1rem' } }), 'Find Data']),
            div({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white', lineHeight: '1.5rem'
              }
            }, [icon('search', { style: { margin: '0 1rem 0 1rem' } }), 'Find Code']),
            a({
              style: {
                padding: '1rem', borderBottom: '1px solid white', color: 'white', lineHeight: '1.5rem',
                textDecoration: 'none', display: 'block'
              },
              href: Nav.getLink('workspaces'),
              onClick: () => this.hideNav()
            }, [
              icon('grid-view', { class: 'is-solid', style: { margin: '0 1rem 0 1rem' } }),
              'Projects'
            ])
          ]),
          div({
            style: { flexGrow: 1, cursor: 'pointer' },
            onClick: () => this.hideNav()
          })
        ]),
      document.getElementById('main-menu-container')
    )
  }

  render() {
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
            size: 36,
            style: { marginRight: '2rem', color: Style.colors.accent, cursor: 'pointer' },
            onClick: () => this.showNav()
          }),
        a({
            style: _.defaults({ display: 'flex', alignItems: 'center' }, Style.elements.pageTitle),
            href: Nav.getLink('workspaces')
          },
          [
            logo(),
            div({}, [
              div({ style: { fontSize: '0.8rem', color: Style.colors.titleAlt } }, 'Saturn'),
              this.props.title
            ])
          ]),
        this.props.children,
        div({ style: { flexGrow: 1 } }),
        link({
          onClick: Utils.getAuthInstance().signOut
        }, 'Sign out'),
        this.state.navShown ? this.buildNav() : null
      ]
    )
  }
})

export const contextBar = function(props, children) {
  return div(mixinDeep({
      style: {
        display: 'flex', alignItems: 'center', backgroundColor: Style.colors.primary,
        color: Style.colors.textAlt, fontWeight: 500,
        height: '3.5rem', padding: '0 1rem', lineHeight: '3.5rem'
      }
    }, props),
    children)
}
