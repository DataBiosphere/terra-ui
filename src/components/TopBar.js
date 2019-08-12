import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment, useState } from 'react'
import { Collapse as RCollapse } from 'react-collapse'
import { a, b, div, h, header, img, nav, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { Transition } from 'react-transition-group'
import { ButtonPrimary, Clickable, FocusTrapper, LabeledCheckbox, spinnerOverlay } from 'src/components/common'
import { icon, profilePic } from 'src/components/icons'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import SignInButton from 'src/components/SignInButton'
import fcIconWhite from 'src/images/brands/firecloud/FireCloud-icon-white.svg'
import headerLeftHexes from 'src/images/header-left-hexes.svg'
import headerRightHexes from 'src/images/header-right-hexes.svg'
import { Ajax } from 'src/libs/ajax'
import { refreshTerraProfile, signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig, isFirecloud, isTerra } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { topBarLogo } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import { authStore, contactUsActive, freeCreditsActive } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { CookiesModal } from 'src/pages/SignIn'


const styles = {
  topBar: {
    flex: 'none', height: 66,
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.primary(0.55)}`,
    zIndex: 2,
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)'
  },
  pageTitle: {
    color: isTerra() ? 'white' : colors.dark(), fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer',
      zIndex: 2
    },
    container: state => ({
      ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(-2rem)' }),
      transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      paddingTop: 66,
      width: 290, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: colors.dark(0.7), height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      zIndex: 2,
      display: 'flex', flexDirection: 'column'
    }),
    icon: {
      marginRight: 12, flex: 'none'
    }
  }
}

const betaTag = b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: colors.primary(1.5),
    padding: '3px 5px', verticalAlign: 'middle',
    borderRadius: 2
  }
}, 'BETA')

const NavItem = ({ children, ...props }) => {
  return h(Interactive, {
    as: 'div',
    style: { borderBottom: `1px solid ${colors.dark(0.55)}` },
    hover: { backgroundColor: colors.dark(0.55) }
  }, [
    h(Clickable, _.merge({
      style: { display: 'flex', alignItems: 'center', color: 'white', margin: '4px' }
    }, props), [children])
  ])
}

const NavSection = ({ children, ...props }) => {
  return h(NavItem, _.merge({
    style: {
      flex: 'none', height: 70, padding: '0 28px', fontWeight: 600,
      color: 'white'
    }
  }, props), [children])
}

const DropDownSubItem = ({ children, ...props }) => {
  return h(NavItem, _.merge({
    style: { padding: '0 3rem', height: 40, fontWeight: 500 }
  }, props), [children])
}

const DropDownSection = ({ titleIcon, title, isOpened, onClick, children }) => {
  return h(Fragment, [
    h(NavSection, { onClick }, [
      titleIcon && icon(titleIcon, { size: 24, style: styles.nav.icon }),
      title,
      div({ style: { flexGrow: 1 } }),
      icon(isOpened ? 'angle-up' : 'angle-down', { size: 18, style: { flex: 'none' } })
    ]),
    h(RCollapse, { isOpened, style: { flex: 'none' } }, [children])
  ])
}

const TopBar = Utils.connectAtom(authStore, 'authState')(class TopBar extends Component {
  static propTypes = {
    title: PropTypes.node,
    href: PropTypes.string, // link destination
    children: PropTypes.node
  }

  constructor(props) {
    super(props)
    this.state = {
      navShown: false,
      openUserMenu: false,
      openLibraryMenu: false,
      openSupportMenu: false
    }
  }

  showNav() {
    this.setState({ navShown: true })
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  hideNav() {
    this.setState({ navShown: false, openUserMenu: false, openLibraryMenu: false, openSupportMenu: false })
    document.body.classList.remove('overlayOpen', 'overHeight')
  }

  buildNav(transitionState) {
    const { authState: { isSignedIn, profile: { firstName = 'Loading...', lastName = '', trialState } } } = this.props
    const { navShown, openLibraryMenu, openSupportMenu, openUserMenu } = this.state

    return h(FocusTrapper, {
      onBreakout: () => this.setState({ navShown: false })
    }, [
      nav({
        role: 'navigation',
        'aria-label': 'Main menu',
        style: navShown ? styles.nav.background : undefined,
        onClick: () => {
          this.hideNav()
        }
      }, [
        div({
          style: styles.nav.container(transitionState),
          onClick: e => e.stopPropagation()
        }, [
          div({ style: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 } }, [
            isSignedIn ?
              h(DropDownSection, {
                title: h(Fragment, [
                  profilePic({ size: 32, style: { marginRight: 12, flex: 'none' } }),
                  div({ style: { ...Style.noWrapEllipsis } }, [`${firstName} ${lastName}`])
                ]),
                onClick: () => this.setState({ openUserMenu: !openUserMenu }),
                isOpened: openUserMenu
              }, [
                h(DropDownSubItem, {
                  href: Nav.getLink('profile'),
                  onClick: () => this.hideNav()
                }, ['Profile']),
                h(DropDownSubItem, {
                  href: Nav.getLink('groups'),
                  onClick: () => this.hideNav()
                }, ['Groups']),
                h(DropDownSubItem, {
                  href: Nav.getLink('billing'),
                  onClick: () => this.hideNav()
                }, ['Billing']),
                h(DropDownSubItem, {
                  href: Nav.getLink('clusters'),
                  onClick: () => this.hideNav()
                }, ['Notebook Runtimes']),
                h(DropDownSubItem, {
                  onClick: signOut
                }, ['Sign Out'])
              ]) :
              div({ style: { flex: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 95 } }, [
                div([
                  h(Clickable, {
                    hover: { textDecoration: 'underline' },
                    style: { color: 'white', marginLeft: '9rem', fontWeight: 600 },
                    onClick: () => this.setState({ openCookiesModal: true })
                  }, ['Cookies policy']),
                  h(SignInButton)
                ])
              ]),
            h(NavSection, {
              href: Nav.getLink('workspaces'),
              onClick: () => this.hideNav()
            }, [
              icon('view-cards', { size: 24, style: styles.nav.icon }),
              'Your Workspaces'
            ]),
            h(DropDownSection, {
              titleIcon: 'library',
              title: 'Terra Library',
              onClick: () => this.setState({ openLibraryMenu: !openLibraryMenu }),
              isOpened: openLibraryMenu
            }, [
              h(DropDownSubItem, {
                href: Nav.getLink('library-datasets'),
                onClick: () => this.hideNav()
              }, ['Data']),
              h(DropDownSubItem, {
                href: Nav.getLink('library-showcase'),
                onClick: () => this.hideNav()
              }, ['Showcase']),
              h(DropDownSubItem, {
                href: Nav.getLink('library-code'),
                onClick: () => this.hideNav()
              }, ['Workflows'])
            ]),
            Utils.switchCase(trialState,
              ['Enabled', () => {
                return h(NavSection, {
                  onClick: () => {
                    this.hideNav()
                    freeCreditsActive.set(true)
                  }
                }, [
                  div({ style: styles.nav.icon }, [icon('cloud', { size: 20 })]),
                  'Sign up for free credits'
                ])
              }],
              ['Enrolled', () => {
                return h(NavSection, {
                  href: 'https://software.broadinstitute.org/firecloud/documentation/freecredits',
                  ...Utils.newTabLinkProps,
                  onClick: () => this.hideNav()
                }, [
                  div({ style: styles.nav.icon }, [icon('cloud', { size: 20 })]),
                  'Access free credits',
                  icon('pop-out', { size: 20, style: { paddingLeft: '0.5rem' } })
                ])
              }],
              ['Terminated', () => {
                return h(NavSection, {
                  onClick: () => this.setState({ finalizeTrial: true })
                }, [
                  div({ style: styles.nav.icon }, [icon('cloud', { size: 20 })]),
                  'Your free trial has ended'
                ])
              }]
            ),
            h(DropDownSection, {
              titleIcon: 'help',
              title: 'Terra Support',
              onClick: () => this.setState({ openSupportMenu: !openSupportMenu }),
              isOpened: openSupportMenu
            }, [
              h(DropDownSubItem, {
                href: 'https://support.terra.bio/hc/en-us',
                onClick: () => this.hideNav(),
                ...Utils.newTabLinkProps
              }, ['How-to Guides']),
              h(DropDownSubItem, {
                href: 'https://support.terra.bio/hc/en-us/community/topics/360000500452',
                onClick: () => this.hideNav(),
                ...Utils.newTabLinkProps
              }, ['Request a Feature']),
              h(DropDownSubItem, {
                href: 'https://support.terra.bio/hc/en-us/community/topics/360000500432',
                onClick: () => this.hideNav(),
                ...Utils.newTabLinkProps
              }, ['Community Forum']),
              isFirecloud() && h(DropDownSubItem, {
                href: 'https://support.terra.bio/hc/en-us/articles/360022694271',
                onClick: () => this.hideNav(),
                ...Utils.newTabLinkProps
              }, ['What\'s different in Terra']),
              h(DropDownSubItem, {
                onClick: () => contactUsActive.set(true)
              }, ['Contact Us'])
            ]),
            isFirecloud() && h(NavSection, {
              disabled: !isSignedIn,
              tooltip: isSignedIn ? undefined : 'Please sign in',
              onClick: () => this.setState({ openFirecloudModal: true })
            }, [
              div({ style: styles.nav.icon }, [
                img({ src: fcIconWhite, alt: '', style: { height: 20, width: 20 } })
              ]), 'Use Classic FireCloud'
            ]),
            div({ style: { borderTop: `1px solid ${colors.dark(0.55)}` } }, []),
            div({
              style: { flex: 'none', padding: 28, marginTop: 'auto', color: colors.dark(0.55), fontSize: 10, fontWeight: 600 }
            }, [
              'Built on: ',
              h(Clickable, {
                href: `https://github.com/DataBiosphere/terra-ui/commits/${SATURN_VERSION}`,
                ...Utils.newTabLinkProps,
                style: { textDecoration: 'underline', marginLeft: '0.25rem' }
              }, [new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()])
            ])
          ])
        ])
      ])
    ])
  }

  render() {
    const { title, href, children, authState } = this.props
    const { navShown, finalizeTrial, openCookiesModal, openFirecloudModal } = this.state

    return h(Fragment, [
      h(Transition, {
        in: navShown,
        timeout: { exit: 200 },
        mountOnEnter: true,
        unmountOnExit: true
      }, [transitionState => this.buildNav(transitionState)]),
      header({
        role: 'banner',
        style: {
          ...styles.topBar,
          background: isTerra() ?
            `81px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat, ${colors.primary()}` :
            colors.light()
        }
      }, [
        h(Clickable, {
          'aria-label': 'Toggle main menu',
          style: { alignSelf: 'stretch', display: 'flex', alignItems: 'center', padding: '0 1rem', margin: '2px 1rem 0 2px' },
          onClick: () => navShown ? this.hideNav() : this.showNav()
        }, [
          icon('bars', {
            size: 36,
            style: {
              color: isTerra() ? 'white' : colors.accent(), flex: 'none', cursor: 'pointer',
              transform: navShown ? 'rotate(90deg)' : undefined, transition: 'transform 0.1s ease-out'
            }
          })
        ]),
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
        finalizeTrial && h(Modal, {
          title: 'Remove button',
          onDismiss: () => this.setState({ finalizeTrial: false }),
          okButton: h(ButtonPrimary, {
            onClick: async () => {
              try {
                await Ajax().User.finalizeTrial()
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
        }),
        openFirecloudModal && h(PreferFirecloudModal, {
          onDismiss: () => this.setState({ openFirecloudModal: false }),
          authState
        })
      ])
    ])
  }
})

const PreferFirecloudModal = ({ onDismiss }) => {
  const [emailAgreed, setEmailAgreed] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { profile: { email, firstName, lastName } } = Utils.useAtom(authStore)
  const currUrl = window.location.href

  const returnToLegacyFC = _.flow(
    withErrorReporting('Error opting out of Terra'),
    Utils.withBusyState(setSubmitting)
  )(async () => {
    await Ajax().User.profile.preferLegacyFirecloud()
    if (emailAgreed === true || reason.length !== 0) {
      await Ajax().User.createSupportRequest({
        name: `${firstName} ${lastName}`,
        email,
        description: reason,
        subject: 'Opt out of Terra',
        type: 'survey',
        attachmentToken: '',
        emailAgreed,
        currUrl
      })
    }
    onDismiss()
    window.location.assign(getConfig().firecloudUrlRoot)
  })

  return h(Modal, {
    onDismiss,
    title: 'Return to classic FireCloud',
    okButton: returnToLegacyFC
  }, [
    'Are you sure you would prefer the previous FireCloud interface?',
    h(FormLabel, ['Please tell us why']),
    h(TextArea, {
      style: { height: 100, marginBottom: '0.5rem' },
      placeholder: 'Enter your reason',
      value: reason,
      onChange: setReason
    }),
    h(LabeledCheckbox, {
      checked: emailAgreed,
      onChange: setEmailAgreed
    }, [span({ style: { marginLeft: '0.5rem' } }, ['You can follow up with me by email.'])]),
    submitting && spinnerOverlay
  ])
}

export default TopBar
