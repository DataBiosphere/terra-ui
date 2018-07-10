import { createPortal } from 'react-dom'
import { a, div, h, span } from 'react-hyperscript-helpers'
import { Clickable, comingSoon } from 'src/components/common'
import { icon, logo, profilePic } from 'src/components/icons'
import PopupTrigger from 'src/components/PopupTrigger'
import { getBasicProfile, signOut } from 'src/libs/auth'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  topBar: {
    flex: 'none', height: 80,
    backgroundColor: 'white', paddingLeft: '1rem', paddingRight: '1rem',
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${Style.colors.secondary}`
  },
  nav: {
    background: {
      display: 'flex', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer'
    },
    container: {
      display: 'table', width: 350, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: Style.colors.navMenu, height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)'
    },
    profile: {
      backgroundColor: Style.colors.background,
      color: Style.colors.title, borderBottom: 'none'
    },
    item: {
      display: 'flex', alignItems: 'center',
      padding: '1rem', borderBottom: `1px solid ${Style.colors.navSeparator}`, color: 'white',
      lineHeight: '1.75rem',
      fontWeight: 400
    },
    icon: {
      margin: '0 1rem'
    },
    popup: {
      container: {
        padding: '0 0.5rem'
      },
      link: {
        display: 'block',
        margin: '0.75rem 0'
      },
      icon: {
        marginRight: '0.5rem'
      }
    }
  }
}

/**
 * @param {string} title
 * @param {array} [children]
 */
export class TopBar extends Component {
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
      div({
        style: styles.nav.background,
        onClick: () => this.hideNav()
      }, [
        div({
          style: styles.nav.container,
          onClick: e => e.stopPropagation()
        }, [
          div({ style: styles.topBar }, [
            icon('bars', {
              dir: 'right',
              size: 36,
              style: { marginRight: '2rem', color: Style.colors.accent, cursor: 'pointer' },
              onClick: () => this.hideNav()
            }),
            a({
              style: {
                ...Style.elements.pageTitle,
                textAlign: 'center', display: 'flex', alignItems: 'center'
              },
              href: Nav.getLink('workspaces'),
              onClick: () => this.hideNav()
            }, [logo(), 'Saturn'])
          ]),
          div({ style: { ...styles.nav.item, ...styles.nav.profile } }, [
            profilePic({ size: 32, style: styles.nav.icon }),
            span({ style: { marginLeft: -8, marginRight: 'auto' } }, [
              getBasicProfile().getName()
            ]),
            h(PopupTrigger, {
              position: 'bottom',
              content: div({ style: styles.nav.popup.container }, [
                a({
                  style: styles.nav.popup.link,
                  href: Nav.getLink('profile'),
                  onClick: () => this.hideNav() // In case we're already there
                }, [
                  icon('user', { style: styles.nav.popup.icon }), 'Profile'
                ]),
                h(Clickable, {
                  style: styles.nav.popup.link,
                  onClick: signOut
                }, [
                  icon('logout', { style: styles.nav.popup.icon }), 'Sign Out'
                ])
              ])
            }, [
              h(Clickable, {
                style: { color: Style.colors.primary }
              }, [icon('caretDown', { size: 18 })])
            ])
          ]),
          div({ style: styles.nav.item }, [
            icon('search', { size: 24, style: styles.nav.icon }), 'Find Data', comingSoon
          ]),
          div({ style: styles.nav.item }, [
            icon('search', { size: 24, style: styles.nav.icon }), 'Find Code', comingSoon
          ]),
          a({
            style: styles.nav.item,
            href: Nav.getLink('workspaces'),
            onClick: () => this.hideNav()
          }, [
            icon('grid-view', { class: 'is-solid', size: 24, style: styles.nav.icon }),
            'Workspaces'
          ])
        ])
      ]),
      document.getElementById('main-menu-container')
    )
  }

  render() {
    return div({ style: styles.topBar }, [
      icon('bars', {
        size: 36,
        style: { marginRight: '2rem', color: Style.colors.accent, cursor: 'pointer' },
        onClick: () => this.showNav()
      }),
      a({
        style: { ...Style.elements.pageTitle, display: 'flex', alignItems: 'center' },
        href: Nav.getLink('workspaces')
      }, [
        logo(),
        div({}, [
          div({
            style: { fontSize: '0.8rem', color: Style.colors.titleAlt, marginLeft: '0.1rem' }
          }, ['Saturn']),
          this.props.title
        ])
      ]),
      this.props.children,
      this.state.navShown && this.buildNav()
    ])
  }
}
