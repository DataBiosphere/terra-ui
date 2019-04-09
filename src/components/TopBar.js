import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { a, b, div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, Clickable, MenuButton } from 'src/components/common'
import { icon, profilePic } from 'src/components/icons'
import Modal from 'src/components/Modal'
import SignInButton from 'src/components/SignInButton'
import { contactUsActive } from 'src/components/SupportRequest'
import { FreeCreditsModal } from 'src/components/TrialBanner'
import headerLeftHexes from 'src/images/header-left-hexes.svg'
import headerRightHexes from 'src/images/header-right-hexes.svg'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore, refreshTerraProfile, signOut } from 'src/libs/auth'
import { menuOpenLogo, topBarLogo } from 'src/libs/logos'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { CookiesModal } from 'src/pages/SignIn'
import { linkToJobManager } from 'src/pages/workspaces/workspace/JobHistory'


const styles = {
  topBar: {
    flex: 'none', height: 66, paddingLeft: '1rem',
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.lightGreen[0]}`,
    zIndex: 2
  },
  pageTitle: {
    color: 'white', fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer'
    },
    container: {
      width: 290, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: colors.gray[2], height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column'
    },
    profile: active => ({
      backgroundColor: active ? colors.gray[6] : colors.gray[5],
      color: colors.gray[0],
      borderBottom: active ? undefined : 'none'
    }),
    profileItem: active => ({
      ...styles.nav.profile(active),
      borderTop: `1px solid ${colors.gray[0]}`,
      padding: '0 3rem', height: 40,
      fontSize: 'unset',
      fontWeight: 500
    }),
    item: {
      display: 'flex', alignItems: 'center', flex: 'none',
      height: 70, padding: '0 28px',
      fontWeight: 600,
      borderBottom: `1px solid ${colors.gray[2]}`, color: 'white'
    },
    subItem: {
      display: 'flex', alignItems: 'center', flex: 'none',
      padding: '10px 28px', paddingLeft: 60,
      fontWeight: 600,
      color: 'white'
    },
    supportItem: {
      display: 'flex', alignItems: 'center', flex: 'none',
      padding: '15px 28px',
      fontWeight: 600, color: 'white'
    },
    icon: {
      marginRight: 12, flex: 'none'
    }
  }
}

const betaTag = b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: colors.lightGreen[0],
    padding: '3px 5px', verticalAlign: 'middle',
    borderRadius: 2
  }
}, 'BETA')

export default _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class TopBar extends Component {
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
    const { authState: { isSignedIn, profile } } = this.props
    const { trialState } = profile

    const librarySubItem = (linkName, iconName, label) => h(Clickable, {
      style: styles.nav.subItem,
      as: 'a',
      hover: { backgroundColor: colors.gray[3] },
      href: Nav.getLink(linkName),
      onClick: () => this.hideNav()
    }, [
      div({ style: styles.nav.icon }, [
        icon(iconName, {
          className: 'is-solid',
          size: 24
        })
      ]),
      label
    ])

    const enabledCredits = h(Clickable, {
      style: styles.nav.item,
      hover: { backgroundColor: colors.gray[3] },
      onClick: () => this.setState({ openFreeCreditsModal: true })
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Sign up for free credits'
    ])

    const enrolledCredits = h(Clickable, {
      style: styles.nav.item,
      as: 'a',
      hover: { backgroundColor: colors.gray[3] },
      href: 'https://software.broadinstitute.org/firecloud/documentation/freecredits',
      target: '_blank',
      onClick: () => this.hideNav()
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Access free credits',
      icon('pop-out', {
        size: 20,
        style: { paddingLeft: '0.5rem' }
      })
    ])

    const terminatedCredits = h(Clickable, {
      style: styles.nav.item,
      hover: { backgroundColor: colors.gray[3] },
      onClick: () => this.setState({ finalizeTrial: true })
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Your free trial has ended'
    ])

    return div({
      style: styles.nav.background,
      onClick: () => {
        this.hideNav()
      }
    }, [
      div({
        style: styles.nav.container,
        onClick: e => e.stopPropagation()
      }, [
        div({
          style: {
            ...styles.topBar,
            background: `81px url(${headerLeftHexes}) no-repeat ${colors.green[1]}`
          }
        }, [
          icon('bars', {
            dir: 'right',
            size: 36,
            style: { marginRight: '2rem', color: 'white', cursor: 'pointer' },
            onClick: () => this.hideNav()
          }),
          a({
            style: {
              ...styles.pageTitle,
              textAlign: 'center', display: 'flex', alignItems: 'center'
            },
            href: Nav.getLink('root'),
            onClick: () => this.hideNav()
          }, [menuOpenLogo(), betaTag])
        ]),
        div({ style: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 } }, [
          isSignedIn ?
            this.buildUserSection() :
            div({
              style: { ...styles.nav.item, ...styles.nav.profile(false), justifyContent: 'center', height: 95 }
            }, [
              div([
                h(Clickable, {
                  style: {
                    color: colors.blue[0],
                    marginLeft: '9rem'
                  },
                  onClick: () => this.setState({ openCookiesModal: true })
                }, ['Cookies policy']),
                h(SignInButton)
              ])
            ]),
          h(Clickable, {
            as: 'a',
            style: styles.nav.item,
            hover: { backgroundColor: colors.gray[3] },
            href: Nav.getLink('workspaces'),
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('grid-chart', { className: 'is-solid', size: 24 })
            ]),
            'Your Workspaces'
          ]),
          linkToJobManager && h(Clickable, {
            as: 'a',
            target: '_blank',
            style: styles.nav.item,
            hover: { backgroundColor: colors.gray[3] },
            href: getConfig().jobManagerUrlRoot,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('layers', { className: 'is-solid', size: 24 })
            ]),
            'Your Jobs',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
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
          (trialState === 'Enabled') && enabledCredits,
          (trialState === 'Enrolled') && enrolledCredits,
          (trialState === 'Terminated') && terminatedCredits,
          h(Clickable, {
            style: { ...styles.nav.supportItem, marginTop: '15px' },
            hover: { backgroundColor: colors.gray[3] },
            onClick: () => contactUsActive.set(true)
          }, [
            div({ style: styles.nav.icon }, [
              icon('envelope', { className: 'is-solid', size: 20 })
            ]),
            'Contact Us'
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.gray[3] },
            href: 'https://broadinstitute.zendesk.com/hc/en-us',
            target: '_blank',
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('help', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Learn about Terra',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.gray[3] },
            href: 'https://broadinstitute.zendesk.com/hc/en-us/community/topics/360000500452-Feature-Requests',
            target: '_blank',
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('bubble-exclamation', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Request a feature',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.gray[3] },
            href: 'https://broadinstitute.zendesk.com/hc/en-us/community/topics/360000500432-General-Discussion',
            target: '_blank',
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('chat-bubble', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Community discussion',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          div({
            style: {
              ..._.omit('borderBottom', styles.nav.item),
              marginTop: 'auto',
              color: colors.gray[3],
              fontSize: 10
            }
          }, [
            'Built on: ',
            new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()
          ])
        ])
      ])
    ])
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
          style: { ...styles.nav.item, ...styles.nav.profile(userMenuOpen) },
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
        as: 'a',
        href: Nav.getLink('billing'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('wallet', { style: styles.nav.icon }), 'Billing'
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
    const { title, href, children, ajax: { User } } = this.props
    const { navShown, openFreeCreditsModal, finalizeTrial, openCookiesModal } = this.state

    return div({
      style: {
        ...styles.topBar,
        background: `81px url(${headerLeftHexes}) no-repeat,
    right url(${headerRightHexes}) no-repeat, ${colors.green[1]}`
      }
    }, [
      icon('bars', {
        size: 36,
        style: { marginRight: '2rem', color: 'white', flex: 'none', cursor: 'pointer' },
        onClick: () => this.showNav()
      }),
      a({
        style: { ...styles.pageTitle, display: 'flex', alignItems: 'center' },
        href: href || Nav.getLink('root')
      }, [
        topBarLogo(),
        div({}, [
          div({
            style: title ? { fontSize: '0.8rem', lineHeight: '19px' } : { fontSize: '1rem', fontWeight: 600 }
          }, [betaTag]),
          title
        ])
      ]),
      children,
      navShown && this.buildNav(),
      openFreeCreditsModal && h(FreeCreditsModal, {
        onDismiss: () => this.setState({ openFreeCreditsModal: false })
      }),
      finalizeTrial && h(Modal, {
        title: 'Remove button',
        onDismiss: () => this.setState({ finalizeTrial: false }),
        okButton: buttonPrimary({
          onClick: async () => {
            try {
              await User.finalizeTrial()
              await refreshTerraProfile()
            } catch (error) {
              reportError('Error finalizing trial', error)
            } finally {
              this.setState({ finalizeTrial: false })
            }
          }
        }, ['Confirm'])
      }, ['Click confirm to remove button forever.']),
      openCookiesModal && h(CookiesModal, {
        onDismiss: () => this.setState({ openCookiesModal: false })
      })
    ])
  }
})
