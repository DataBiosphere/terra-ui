import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { createPortal } from 'react-dom'
import { a, b, div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { Clickable, MenuButton } from 'src/components/common'
import { icon, logo, profilePic } from 'src/components/icons'
import { pushNotification } from 'src/components/Notifications'
import SignInButton from 'src/components/SignInButton'
import SupportRequestModal from 'src/components/SupportRequestModal'
import { authStore, signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  topBar: {
    flex: 'none', height: 90,
    backgroundColor: 'white', paddingLeft: '1rem',
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.blue[0]}`,
    boxShadow: Style.standardShadow, zIndex: 1
  },
  pageTitle: {
    color: colors.darkBlue[0], fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  nav: {
    background: {
      position: 'fixed', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer'
    },
    container: {
      width: 290, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: colors.darkBlue[0], height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column'
    },
    profile: active => ({
      backgroundColor: active ? colors.gray[5] : colors.gray[4],
      color: colors.darkBlue[0],
      borderBottom: active ? undefined : 'none'
    }),
    profileItem: active => ({
      ...styles.nav.profile(active),
      borderTop: `1px solid ${colors.darkBlue[0]}`,
      padding: '0 3rem', height: 40,
      fontSize: 'unset',
      fontWeight: 500
    }),
    item: {
      display: 'flex', alignItems: 'center', flex: 'none',
      height: 70, padding: '0 28px',
      fontWeight: 600,
      borderBottom: `1px solid ${colors.darkBlue[2]}`, color: 'white'
    },
    subItem: {
      display: 'flex', alignItems: 'center', flex: 'none',
      padding: '10px 28px', paddingLeft: 60,
      fontWeight: 600,
      color: 'white'
    },
    icon: {
      marginRight: 12, flex: 'none'
    }
  }
}

const betaTag = b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: '#73AD43',
    padding: '3px 5px', verticalAlign: 'middle',
    borderRadius: 2
  }
}, 'BETA')

export default Utils.connectAtom(authStore, 'authState')(class TopBar extends Component {
  static propTypes = {
    title: PropTypes.node,
    href: PropTypes.string, // link destination
    children: PropTypes.node
  }

  showNav() {
    this.setState({ navShown: true })
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  hideNav() {
    this.setState({ navShown: false, userMenuOpen: false })
    document.body.classList.remove('overlayOpen', 'overHeight')
  }

  buildNav() {
    const { authState: { isSignedIn } } = this.props

    const librarySubItem = (linkName, iconName, label) => h(Clickable, {
      style: styles.nav.subItem,
      as: 'a',
      hover: { backgroundColor: colors.darkBlue[1] },
      href: Nav.getLink(linkName),
      onClick: () => this.hideNav()
    }, [
      div({ style: styles.nav.icon }, [
        icon(iconName, { className: 'is-solid', size: 24 })
      ]),
      label
    ])
    return createPortal(
      div({
        style: styles.nav.background,
        onClick: () => {
          this.hideNav()
        }
      }, [
        div({
          style: styles.nav.container,
          onClick: e => e.stopPropagation()
        }, [
          div({ style: styles.topBar }, [
            icon('bars', {
              dir: 'right',
              size: 36,
              style: { marginRight: '2rem', color: colors.purple[0], cursor: 'pointer' },
              onClick: () => this.hideNav()
            }),
            a({
              style: {
                ...styles.pageTitle,
                textAlign: 'center', display: 'flex', alignItems: 'center'
              },
              href: Nav.getLink('root'),
              onClick: () => this.hideNav()
            }, [logo(), betaTag])
          ]),
          isSignedIn ?
            this.buildUserSection() :
            div({
              style: { ...styles.nav.item, ...styles.nav.profile(false), boxShadow: `inset ${Style.standardShadow}`, justifyContent: 'center' }
            }, [
              h(SignInButton)
            ]),
          h(Clickable, {
            as: 'a',
            style: styles.nav.item,
            hover: { backgroundColor: colors.darkBlue[1] },
            href: Nav.getLink('workspaces'),
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('grid-chart', { className: 'is-solid', size: 24 })
            ]),
            'Your Workspaces'
          ]),
          div({ style: { borderBottom: styles.nav.item.borderBottom, padding: '14px 0' } }, [
            div({ style: { ...styles.nav.subItem, paddingLeft: 28 } }, [
              div({ style: styles.nav.icon }, [
                icon('library', { className: 'is-solid', size: 24 })
              ]),
              'Library'
            ]),
            librarySubItem('library-datasets', 'data-cluster', 'Datasets'),
            librarySubItem('library-showcase', 'grid-chart', 'Showcase & Tutorials'),
            librarySubItem('library-code', 'tools', 'Code & Tools')
          ]),
          div({ style: { marginTop: '1rem' } }, [
            h(Clickable, {
              style: { ...styles.nav.item, borderBottom: 'none', height: 50 },
              hover: { backgroundColor: colors.darkBlue[1] },
              onClick: () => this.setState({ showingSupportModal: true })
            }, [
              div({ style: styles.nav.icon }, [
                icon('envelope', { className: 'is-solid', size: 20 })
              ]),
              'Contact Us'
            ])
          ]),
          div({
            style: {
              ..._.omit('borderBottom', styles.nav.item), marginTop: 'auto',
              color: colors.darkBlue[2],
              fontSize: 10
            }
          }, [
            'Built on: ',
            new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()
          ])
        ])
      ]),
      document.getElementById('main-menu-container')
    )
  }

  buildUserSection() {
    const { authState: { profile: { firstName = 'Loading...', lastName = '' } } } = this.props
    const { userMenuOpen } = this.state

    return h(Collapse, {
      defaultHidden: true,
      showIcon: false,
      animate: true,
      expandTitle: true,
      style: styles.nav.profile(false),
      buttonStyle: { marginBottom: 0 },
      title: [
        h(Clickable, {
          style: { ...styles.nav.item, ...styles.nav.profile(userMenuOpen), boxShadow: `inset ${Style.standardShadow}` },
          hover: styles.nav.profile(true),
          onClick: () => this.setState({ userMenuOpen: !userMenuOpen })
        }, [
          div({ style: styles.nav.icon }, [
            profilePic({ size: 32 })
          ]),
          div({ style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, [
            `${firstName} ${lastName}`
          ]),
          div({ style: { flexGrow: 1 } }),
          icon(`angle ${userMenuOpen ? 'up' : 'down'}`,
            { size: 18, style: { flex: 'none' } })
        ])
      ]
    }, [
      h(MenuButton, {
        as: 'a',
        href: Nav.getLink('profile'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('user', { style: styles.nav.icon }), 'Profile'
      ]),
      h(MenuButton, {
        as: 'a',
        href: Nav.getLink('groups'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('users', { style: styles.nav.icon }), 'Groups'
      ]),
      h(MenuButton, {
        onClick: signOut,
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true)
      }, [
        icon('logout', { style: styles.nav.icon }), 'Sign Out'
      ])
    ])
  }

  render() {
    const { title, href, children } = this.props
    const { navShown, showingSupportModal } = this.state
    return div([
      div({ style: styles.topBar }, [
        icon('bars', {
          size: 36,
          style: { marginRight: '2rem', color: colors.purple[0], flex: 'none', cursor: 'pointer' },
          onClick: () => this.showNav()
        }),
        a({
          style: { ...styles.pageTitle, display: 'flex', alignItems: 'center' },
          href: href || Nav.getLink('root')
        }, [
          logo(),
          div({}, [
            div({
              style: _.merge(title ? { fontSize: '0.8rem', lineHeight: '19px' } : { fontSize: '1rem', fontWeight: 600 },
                { color: colors.darkBlue[2], marginLeft: '0.1rem' })
            }, [betaTag]),
            title
          ])
        ]),
        children,
        navShown && this.buildNav(),
        showingSupportModal && h(SupportRequestModal, {
          onDismiss: () => this.setState({ showingSupportModal: false }),
          onSuccess: () => {
            this.setState({ showingSupportModal: false })
            pushNotification({ message: 'Message sent successfully' })
          }
        })
      ])
    ])
  }
})
